import {Chip8} from './src/core/cpu.js';
import {Video} from './src/devices/video.js';
import {Audio} from './src/devices/audio.js';
import {Keypad} from './src/devices/keypad.js';
import {
    loadQuirkUI,
    readQuirkUI,
    loadSavedQuirks,
    saveQuirks
} from "./src/system/config.js";

const canvas =  document.getElementById("screen");
const ctx = canvas.getContext("2d");

const keypad = new Keypad();
const cpu = new Chip8(keypad);
const video = new Video(ctx);
const audio = new Audio();

// Unlock audio on the first user interaction
canvas.addEventListener("pointerdown", ()=>audio.init(), {once:true});

const savedQuirks = loadSavedQuirks();

cpu.setQuirks(savedQuirks);
loadQuirkUI(savedQuirks);

const configOverlay = document.querySelector("#config-overlay");
const debugOverlay = document.querySelector("#debug-overlay");

const configBtn = document.querySelector("#config-btn");
const debugBtn = document.querySelector("#debug-btn");

const closeConfig = document.querySelector("#close-config");
const closeDebug = document.querySelector("#close-debug");

configBtn.addEventListener("click", () => {
    configOverlay.classList.add("active");
});

debugBtn.addEventListener("click", () => {
    debugOverlay.classList.add("active");
});

closeConfig.addEventListener("click", () => {
    configOverlay.classList.remove("active");
});

closeDebug.addEventListener("click", () => {
    debugOverlay.classList.remove("active");
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape")
        return;

    configOverlay.classList.remove("active");
    debugOverlay.classList.remove("active");
});

function toHex(value, digits) {
    return value.toString(16).toUpperCase().padStart(digits, "0");
}

function updateDebugState() {
    document.querySelector("#debug-pc").textContent = toHex(cpu.PC, 4);
    document.querySelector("#debug-i").textContent = toHex(cpu.I, 4);
    document.querySelector("#debug-sp").textContent = toHex(cpu.SP, 2);
    document.querySelector("#debug-dt").textContent = toHex(cpu.DT, 2);
    document.querySelector("#debug-st").textContent = toHex(cpu.ST, 2);

    for (let i = 0; i < 16; i++) {
        const register = document.querySelector(
            `#debug-v${i.toString(16)}`
        );

        register.textContent = toHex(cpu.V[i], 2);
    }
}

let animationId = null;
let paused = false;
let lastSoundState = false;

const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speed-value");

const romName = document.getElementById("rom-name");

document.getElementById("rom-upload").addEventListener("change", async(event)  => {
    await audio.init();

    const file =  event.target.files[0];
    if (!file) return;

    romName.textContent = file.name;

    try {
        const buffer = await file.arrayBuffer();
        const rom = new Uint8Array(buffer);

        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        } 

        cpu.loadRom(rom);
        animationId = requestAnimationFrame(mainLoop);
    } catch(error) {
        console.log("Error loading ROM: ", error);
    }
});

document.getElementById("reset-rom").addEventListener("click", () => cpu.restart());

let pauseRom = document.getElementById("pause-rom");

pauseRom.addEventListener("click", () => {
    if (!paused) {
        paused = true;
        pauseRom.innerText = "RESUME";
    } else {
        paused = false;
        pauseRom.innerText = "PAUSE";
    }
});

speedSlider.addEventListener("input", (e) => {
    const cycles = Number(e.target.value);
    cpu.cyclesPerFrame = cycles;

    const hz = cycles * 60;
    speedValue.textContent = `${hz} Hz`;
});

document.querySelectorAll("#config-overlay input[type=checkbox]").forEach(input => {
    input.addEventListener("change", ()=>{
        const quirks = readQuirkUI();

        cpu.setQuirks(quirks);
        saveQuirks(quirks);
    });
});

// Execute one emulator frame
function mainLoop()
{
    if (!paused) {
        cpu.cpuCycle();

        const soundOn = cpu.ST > 0;

        if (soundOn !== lastSoundState) {
            if (soundOn)
                audio.play();
            else
                audio.stop();

            lastSoundState = soundOn;
        }
    } else {
        if (lastSoundState) {
            audio.stop();
            lastSoundState = false;
        }
    }

    video.render(cpu);
    updateDebugState();

    animationId = requestAnimationFrame(mainLoop);
}
