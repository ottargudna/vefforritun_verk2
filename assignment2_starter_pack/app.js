

document.addEventListener('DOMContentLoaded', () => {
    const synth = new Tone.Synth().toDestination();
    const playButton = document.getElementById('tunebtn');
    const dropdown = document.getElementById('tunesDrop');
    let tunes = [];


    async function GetTunes() {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/tunes');
            tunes = response.data; 
            while (dropdown.options.length > 0) {
                dropdown.remove(0);
            }
    
            tunes.forEach(tune => {
                const option = new Option(tune.name, tune.name);
                dropdown.add(option);
            });
        } catch (error) {
            console.error('Failed to get tunes:', error);
        }
    }
    GetTunes(); 
    function playTune(tune) {
        tune.forEach(({note, duration, timing}) => {
            const time = Tone.now() + timing;
            synth.triggerAttackRelease(note, duration, time);
        });
    }

    playButton.addEventListener('click', () => {
        const selectedTuneName = dropdown.value;
        const selectedTune = tunes.find(tune => tune.name === selectedTuneName);
        if (selectedTune) {
            playTune(selectedTune.tune);
        }
    });

    document.querySelectorAll('.whitebtn, .blackbtn').forEach(button => {
        button.addEventListener('mousedown', () => {
            const note = button.textContent.trim().split('\n')[0];
            Tone.start().then(() => {
                synth.triggerAttack(note);
            });
        });
        button.addEventListener('mouseup', () => {
            synth.triggerRelease();
        });
    });

    const keyMap = {
        'KeyA': 'C4',
        'KeyW': 'C#4',
        'KeyS': 'D4',
        'KeyE': 'D#4',
        'KeyD': 'E4',
        'KeyF': 'F4',
        'KeyT': 'F#4',
        'KeyG': 'G4',
        'KeyY': 'G#4',
        'KeyH': 'A4',
        'KeyU': 'Bb4',
        'KeyJ': 'B4',
        'KeyK': 'C5',
        'KeyO': 'C#5',
        'KeyL': 'D5',
        'KeyP': 'D#5',
        'Semicolon': 'E5',
    };

    let activeNotes = {};

    document.addEventListener('keydown', event => {
        const note = keyMap[event.code];
        if (note && !activeNotes[note]) {
            Tone.start().then(() => {
                synth.triggerAttack(note);
                activeNotes[note] = true;
            });
        }
    });

    document.addEventListener('keyup', event => {
        const note = keyMap[event.code];
        if (note && activeNotes[note]) {
            synth.triggerRelease();
            delete activeNotes[note];
        }
    });
});



document.getElementById('recordbtn').addEventListener('click', startRecording);
document.getElementById('stopbtn').addEventListener('click', stopRecording);

let isRecording = false;
let recordedNotes = [];
let recordingStartTime;

function startRecording() {
    if (!isRecording) {
        isRecording = true;
        recordedNotes = [];
        recordingStartTime = Tone.now();
        document.getElementById('stopbtn').disabled = false;
    }
}


function stopRecording() {
    isRecording = false;
    document.getElementById('stopbtn').disabled = true; 
    const tuneName = document.getElementById('recordName').value;
    if (tuneName && recordedNotes.length > 0) {
        const recordedData = {
            name: tuneName,
            tune: recordedNotes.map(note => ({
              note: note.note,
              duration: "8n",
              timing: note.timestamp
            }))
          };
        saveRecordedTune(recordedData);
    }
}

function recordNote(note) {
    if (isRecording) {
        const noteTimestamp = Tone.now() - recordingStartTime;
        recordedNotes.push({ note, timestamp: noteTimestamp });
    }
}


document.querySelectorAll('.piano-key').forEach(key => {
    key.addEventListener('mousedown', () => {
        const note = key.getAttribute('data-note');
        playNote(note);
        recordNote(note);
    });
});

async function saveRecordedTune(recordedData) {
    const url = 'http://localhost:3000/api/v1/tunes';
    try {
        const formattedData = {
            name: recordedData.name,
            tune: recordedData.tune.map(note => ({
                note: note.note,
                duration: note.duration, 
                timing: note.timing
            }))
        };
        
        const response = await axios.post(url, formattedData);
        alert("Tune saved successfully");
        GetTunes(); 
    } catch (error) {
        console.error("Failed to save tune", error.response || error);
        alert("Failed to save tune. Error: " + (error.response?.data?.message || error.message));
    }
}