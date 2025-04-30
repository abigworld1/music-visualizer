import { useState, useRef, useEffect } from "react";
import "./App.css";

export default function App() {
  const [audioFile, setAudioFile] = useState("music/edge of knowledge.wav");
  const [fileName, setFileName] = useState("edge of knowledge.wav");
  const [displayName, setDisplayName] = useState("edge of knowledge");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFileName, setShowFileName] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [selectedFont, setSelectedFont] = useState("Arial, sans-serif");
  const [selectedVisuals, setSelectedVisuals] = useState({
    bars: true,
    circles: false,
    waves: false,
    particles: false,
    polarLines: false,
    spectrogramGrid: false,
  });
  const [waveAmplitude, setWaveAmplitude] = useState(50);
  const [waveBaseline, setWaveBaseline] = useState(128);
  const [particleCount, setParticleCount] = useState(50);
  const [snowSize, setSnowSize] = useState(3);
  const [lineCount, setLineCount] = useState(60);
  const [lineLength, setLineLength] = useState(50);
  const [gridCellSize, setGridCellSize] = useState(20);
  const [gridSensitivity, setGridSensitivity] = useState(50);
  const [isDefaultLoaded, setIsDefaultLoaded] = useState(true);

  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const gridCellsRef = useRef([]);

  // Font options
  const fontOptions = [
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Times New Roman", value: "Times New Roman, serif" },
    { name: "Courier New", value: "Courier New, monospace" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Verdana", value: "Verdana, sans-serif" },
    { name: "Impact", value: "Impact, sans-serif" },
    { name: "Comic Sans MS", value: "Comic Sans MS, cursive" },
  ];

  // Set canvas dimensions for Instagram Reel (9:16 aspect ratio)
  useEffect(() => {
    const setCanvasDimensions = () => {
      if (canvasRef.current && canvasContainerRef.current) {
        const container = canvasContainerRef.current;
        const containerWidth = container.clientWidth;
        // Calculate height based on 9:16 aspect ratio
        const reelHeight = (containerWidth * 16) / 9;

        canvasRef.current.width = containerWidth;
        canvasRef.current.height = reelHeight;

        // Set fixed height to container to maintain aspect ratio
        container.style.height = `${reelHeight}px`;
      }
    };

    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);
    return () => window.removeEventListener("resize", setCanvasDimensions);
  }, []);

  // Initialize particles
  useEffect(() => {
    initParticles();
  }, [particleCount, snowSize]);

  // Initialize grid cells
  useEffect(() => {
    initGridCells();
  }, [gridCellSize]);

  // Refresh animation when font or visualization changes
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      // Cancel existing animation and restart to apply font changes
      cancelAnimationFrame(animationRef.current);
      visualize();
    }
  }, [fontSize, selectedFont, showFileName]);

  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      cancelAnimationFrame(animationRef.current);
      visualize();
    }
  }, [
    selectedVisuals,
    waveAmplitude,
    snowSize,
    lineCount,
    lineLength,
    gridCellSize,
    gridSensitivity,
  ]);

  // Load default audio file
  useEffect(() => {
    if (audioRef.current && isDefaultLoaded) {
      audioRef.current.src = audioFile;
      audioRef.current.addEventListener('loadeddata', () => {
        console.log("Default audio file loaded successfully");
      });
      audioRef.current.addEventListener('error', (e) => {
        console.error("Error loading default audio file:", e);
        // Reset to allow user to select their own file
        setAudioFile(null);
        setFileName("");
        setDisplayName("");
        setIsDefaultLoaded(false);
      });
    }
  }, [audioFile, isDefaultLoaded]);

  // Snow particle initialization
  const initParticles = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.width || canvasContainerRef.current.clientWidth;
    const height = canvas.height || canvasContainerRef.current.clientHeight;

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        // Base radius now uses the snowSize state
        radius: (Math.random() * 2.5 + 1.5) * (snowSize / 3),
        speed: Math.random() * 1 + 0.5,
        swingFactor: Math.random() * 2 + 1,
        swingOffset: Math.random() * Math.PI * 2,
        energy: 0,
      });
    }
    particlesRef.current = particles;
  };

  // Grid cell initialization
  const initGridCells = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.width || canvasContainerRef.current.clientWidth;
    const height = canvas.height || canvasContainerRef.current.clientHeight;

    const cellSize = gridCellSize;
    const rows = Math.ceil(height / cellSize);
    const cols = Math.ceil(width / cellSize);

    const cells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cells.push({
          x: col * cellSize,
          y: row * cellSize,
          size: cellSize,
          energy: 0,
          targetEnergy: 0,
        });
      }
    }

    gridCellsRef.current = cells;
  };

  // Calculate average volume
  const calculateAverageVolume = (dataArray) => {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Convert filename to lowercase and check extension
      const fileName = file.name.toLowerCase();
      // Allow various audio file extensions
      const validExtensions = ['.wav', '.mp3', '.ogg', '.m4a', '.aac', '.flac', '.mp4'];
      const isValidAudio = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (isValidAudio || file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        setAudioFile(url);
        setFileName(file.name);
        // Remove extension for display name
        setDisplayName(file.name.replace(/\.[^/.]+$/, ""));
        setIsDefaultLoaded(false);

        if (audioRef.current) {
          audioRef.current.src = url;
        }
      } else {
        alert("Please upload an audio file (WAV, MP3, OGG, M4A, AAC, FLAC supported)");
      }
    }
  };

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      sourceRef.current = audioContextRef.current.createMediaElementSource(
        audioRef.current
      );
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }
  };

  const togglePlay = () => {
    if (!audioFile) return;

    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current);
    } else {
      setupAudioContext();
      audioRef.current.play();
      visualize();
    }

    setIsPlaying(!isPlaying);
  };

  const handleVisualChange = (type) => {
    setSelectedVisuals((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));

    // Ensure at least one visualization is selected
    const updatedVisuals = {
      ...selectedVisuals,
      [type]: !selectedVisuals[type],
    };

    if (!Object.values(updatedVisuals).some((v) => v)) {
      setSelectedVisuals((prev) => ({
        ...prev,
        bars: true,
      }));
    }
  };

  const visualize = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    // For smoothing waves
    let prevWaveData = new Array(bufferLength).fill(waveBaseline);

    // For smoothing polar line values
    let prevPolarData = new Array(lineCount).fill(0);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeDataArray);

      // Calculate average volume
      const avgVolume = calculateAverageVolume(dataArray);

      ctx.fillStyle = "rgb(20, 20, 20)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Bar visualization
      if (selectedVisuals.bars) {
        const barWidth = (WIDTH / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] * HEIGHT) / 512;

          const grayValue = Math.min(255, dataArray[i] + 50);
          ctx.fillStyle = `rgba(${grayValue}, ${grayValue}, ${grayValue}, 0.7)`;
          ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

          x += barWidth + 1;
          if (x > WIDTH) break;
        }
      }

      // Circle visualization
      if (selectedVisuals.circles) {
        ctx.beginPath();
        ctx.arc(WIDTH / 2, HEIGHT / 2, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fill();

        const maxRadius = Math.min(WIDTH, HEIGHT) / 2;

        for (let i = 0; i < bufferLength; i += 5) {
          const radius = (dataArray[i] * maxRadius) / 255;
          if (radius > 0) {
            ctx.beginPath();
            ctx.arc(WIDTH / 2, HEIGHT / 2, radius, 0, 2 * Math.PI);
            const opacity = (dataArray[i] / 255) * 0.6;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      // Wave visualization
      if (selectedVisuals.waves) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();

        const sliceWidth = WIDTH / bufferLength;
        let x = 0;

        const amplitudeScale = waveAmplitude / 100;
        const volumeFactor = Math.max(0.2, Math.min(1.5, avgVolume / 128));

        for (let i = 0; i < bufferLength; i++) {
          const deviation =
            (timeDataArray[i] - waveBaseline) * amplitudeScale * volumeFactor;

          const smoothedValue =
            prevWaveData[i] * 0.3 + (waveBaseline + deviation) * 0.7;
          prevWaveData[i] = smoothedValue;

          const y =
            HEIGHT / 2 + ((smoothedValue - waveBaseline) * HEIGHT) / 256;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
          if (x > WIDTH) break;
        }

        ctx.stroke();
      }

      // Snow particles visualization with enhanced audio reactivity
      if (selectedVisuals.particles) {
        const particles = particlesRef.current;
        const volume = avgVolume / 255;
        const time = Date.now() / 1000;

        particles.forEach((p) => {
          // Update energy based on volume - increased amplitude for better reactivity
          p.energy = volume * 2.5; // Amplified to make changes more visible

          // Make particles fall from top to bottom
          p.y += p.speed * (1 + p.energy);

          // Add swinging motion (like snow)
          p.x +=
            Math.sin(time * p.swingFactor + p.swingOffset) *
            (0.5 + p.energy * 1.5);

          // Reset position when reaching bottom
          if (p.y > HEIGHT) {
            p.y = 0;
            p.x = Math.random() * WIDTH;
          }

          // Keep particles within screen bounds
          if (p.x < 0) p.x = WIDTH;
          if (p.x > WIDTH) p.x = 0;

          // Draw snowflake with dramatically enhanced size variation based on audio
          // Significantly larger size multiplier based on energy
          const radius = p.radius * (1 + p.energy * 4); // Amplified size change
          const brightness = 200 + Math.floor(p.energy * 55);

          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.8)`;
          ctx.fill();

          // Draw snowflake pattern for particles
          // Larger minimum threshold to make sure more snowflakes show their pattern
          if (radius > 1.5) {
            // Draw cross pattern for snowflake
            const armLength = radius * 1.5;
            ctx.beginPath();
            // Horizontal line
            ctx.moveTo(p.x - armLength, p.y);
            ctx.lineTo(p.x + armLength, p.y);
            // Vertical line
            ctx.moveTo(p.x, p.y - armLength);
            ctx.lineTo(p.x, p.y + armLength);
            // Diagonal line 1
            ctx.moveTo(p.x - armLength * 0.7, p.y - armLength * 0.7);
            ctx.lineTo(p.x + armLength * 0.7, p.y + armLength * 0.7);
            // Diagonal line 2
            ctx.moveTo(p.x - armLength * 0.7, p.y + armLength * 0.7);
            ctx.lineTo(p.x + armLength * 0.7, p.y - armLength * 0.7);
            ctx.strokeStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.4)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      }

      // Polar Lines visualization
      if (selectedVisuals.polarLines) {
        const centerX = WIDTH / 2;
        const centerY = HEIGHT / 2;
        const maxLength = Math.min(WIDTH, HEIGHT) * (lineLength / 100);

        // Distribute frequency data to radial lines
        const step = Math.floor(bufferLength / lineCount);

        // Draw radial lines
        for (let i = 0; i < lineCount; i++) {
          const angle = (i / lineCount) * Math.PI * 2;
          const dataIndex = i * step;

          // Determine line length based on volume (with smoothing)
          const rawValue = dataArray[dataIndex % bufferLength] / 255;
          const smoothedValue = prevPolarData[i] * 0.3 + rawValue * 0.7;
          prevPolarData[i] = smoothedValue;

          const length = smoothedValue * maxLength;

          // Calculate line coordinates
          const x1 = centerX;
          const y1 = centerY;
          const x2 = centerX + Math.cos(angle) * length;
          const y2 = centerY + Math.sin(angle) * length;

          // Line thickness based on volume
          const lineWidth = 1 + smoothedValue * 4;

          // Line brightness based on volume
          const brightness = 150 + Math.floor(smoothedValue * 105);
          const opacity = 0.3 + smoothedValue * 0.6;

          // Draw line
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${opacity})`;
          ctx.lineWidth = lineWidth;
          ctx.stroke();

          // Fade-out effect with subline
          if (smoothedValue > 0.2) {
            const subLength = length * 1.3;
            const x3 = centerX + Math.cos(angle) * subLength;
            const y3 = centerY + Math.sin(angle) * subLength;

            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.strokeStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${
              opacity * 0.3
            })`;
            ctx.lineWidth = lineWidth * 0.5;
            ctx.stroke();
          }
        }
      }

      // Spectrogram Grid visualization
      if (selectedVisuals.spectrogramGrid) {
        const cells = gridCellsRef.current;
        const sensitivity = gridSensitivity / 100; // Normalize sensitivity to 0-1 range

        // Analyze frequency data to update grid energy
        const frequencyStep = Math.floor(bufferLength / cells.length);

        cells.forEach((cell, index) => {
          // Calculate energy from frequency data
          const dataIndex = (index * frequencyStep) % bufferLength;
          const rawEnergy = (dataArray[dataIndex] / 255) * sensitivity * 2; // Apply sensitivity

          // Apply smoothing
          cell.targetEnergy = rawEnergy;
          cell.energy = cell.energy * 0.7 + cell.targetEnergy * 0.3;

          // Draw grid cell based on energy
          if (cell.energy > 0.05) {
            // Set threshold to reduce noise
            const size = cell.size * Math.min(0.9, cell.energy * 0.8); // Limit max size
            const x = cell.x + (cell.size - size) / 2;
            const y = cell.y + (cell.size - size) / 2;

            // Brightness based on energy
            const brightness = 100 + Math.floor(cell.energy * 155);
            const opacity = Math.min(0.9, 0.2 + cell.energy * 0.7);

            // Draw grid cell
            ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${opacity})`;

            // Draw circle instead of square for modern look
            ctx.beginPath();
            ctx.arc(
              cell.x + cell.size / 2,
              cell.y + cell.size / 2,
              size / 2,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Draw outline for high energy
            if (cell.energy > 0.4) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }

            // Add pulse effect for very high energy
            if (cell.energy > 0.7) {
              const pulseSize = size * 1.3;
              const pulseX = cell.x + (cell.size - pulseSize) / 2;
              const pulseY = cell.y + (cell.size - pulseSize) / 2;

              ctx.beginPath();
              ctx.arc(
                cell.x + cell.size / 2,
                cell.y + cell.size / 2,
                pulseSize / 2,
                0,
                Math.PI * 2
              );
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        });
      }

      // Display filename
      if (showFileName && displayName) {
        ctx.font = `${fontSize}px ${selectedFont}`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(displayName, WIDTH / 2, HEIGHT / 2);
      }
    };

    draw();
  };

  return (
    <div className="app">
      <h1>Music Visualizer</h1>

      <div className="input-section">
        <input
          type="file"
          accept="audio/*,.wav,.mp3,.ogg,.m4a,.aac,.flac"
          onChange={handleFileChange}
          id="file-input"
          className="file-input"
        />
        <label htmlFor="file-input" className="file-input-label">
          Choose audio file
        </label>
      </div>

      {fileName && (
        <div className="file-info">
          {isDefaultLoaded ? "Default file: " : "Selected file: "}{displayName}
        </div>
      )}

      <div className="control-panel">
        <div className="control-row">
          <button
            onClick={togglePlay}
            disabled={!audioFile}
            className={`control-button ${!audioFile ? "disabled" : ""}`}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={showFileName}
                onChange={() => setShowFileName(!showFileName)}
              />
              Show Filename
            </label>
          </div>
        </div>

        {/* Font settings */}
        <div className="control-row">
          <div className="slider-container">
            <label>Font Size: {fontSize}px</label>
            <input
              type="range"
              min="8"
              max="64"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="slider"
            />
          </div>

          <div className="control-group">
            <label>Font:</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="select"
            >
              {fontOptions.map((font) => (
                <option key={font.name} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visualization selection */}
        <div className="control-row">
          <label>Visualizations:</label>
          <div className="checkbox-group">
            <div className="visual-option">
              <input
                type="checkbox"
                id="bars"
                checked={selectedVisuals.bars}
                onChange={() => handleVisualChange("bars")}
              />
              <label htmlFor="bars">Bars</label>
            </div>

            <div className="visual-option">
              <input
                type="checkbox"
                id="circles"
                checked={selectedVisuals.circles}
                onChange={() => handleVisualChange("circles")}
              />
              <label htmlFor="circles">Circles</label>
            </div>

            <div className="visual-option">
              <input
                type="checkbox"
                id="waves"
                checked={selectedVisuals.waves}
                onChange={() => handleVisualChange("waves")}
              />
              <label htmlFor="waves">Waves</label>
            </div>

            <div className="visual-option">
              <input
                type="checkbox"
                id="particles"
                checked={selectedVisuals.particles}
                onChange={() => handleVisualChange("particles")}
              />
              <label htmlFor="particles">Snow</label>
            </div>

            <div className="visual-option">
              <input
                type="checkbox"
                id="polarLines"
                checked={selectedVisuals.polarLines}
                onChange={() => handleVisualChange("polarLines")}
              />
              <label htmlFor="polarLines">Polar Lines</label>
            </div>

            <div className="visual-option">
              <input
                type="checkbox"
                id="spectrogramGrid"
                checked={selectedVisuals.spectrogramGrid}
                onChange={() => handleVisualChange("spectrogramGrid")}
              />
              <label htmlFor="spectrogramGrid">Spectrogram Grid</label>
            </div>
          </div>
        </div>

        {/* Wave sensitivity adjustment (only shown if Waves is selected) */}
        {selectedVisuals.waves && (
          <div className="control-row">
            <div className="slider-container">
              <label>Wave Sensitivity: {waveAmplitude}%</label>
              <input
                type="range"
                min="5"
                max="100"
                value={waveAmplitude}
                onChange={(e) => setWaveAmplitude(parseInt(e.target.value))}
                className="sensitivity-slider"
              />
            </div>
          </div>
        )}

        {/* Particle count adjustment (only shown if Particles is selected) */}
        {selectedVisuals.particles && (
          <div className="control-row">
            <div className="slider-container">
              <label>Snow Density: {particleCount}</label>
              <input
                type="range"
                min="10"
                max="200"
                value={particleCount}
                onChange={(e) => setParticleCount(parseInt(e.target.value))}
                className="sensitivity-slider"
              />
            </div>
          </div>
        )}

        {/* Snow size adjustment (only shown if Particles is selected) */}
        {selectedVisuals.particles && (
          <div className="control-row">
            <div className="slider-container">
              <label>Snow Size: {snowSize}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={snowSize}
                onChange={(e) => setSnowSize(parseInt(e.target.value))}
                className="sensitivity-slider"
              />
            </div>
          </div>
        )}

        {/* Polar Lines adjustments (only shown if Polar Lines is selected) */}
        {selectedVisuals.polarLines && (
          <>
            <div className="control-row">
              <div className="slider-container">
                <label>Line Count: {lineCount}</label>
                <input
                  type="range"
                  min="10"
                  max="180"
                  value={lineCount}
                  onChange={(e) => setLineCount(parseInt(e.target.value))}
                  className="sensitivity-slider"
                />
              </div>
            </div>
            <div className="control-row">
              <div className="slider-container">
                <label>Line Length: {lineLength}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={lineLength}
                  onChange={(e) => setLineLength(parseInt(e.target.value))}
                  className="sensitivity-slider"
                />
              </div>
            </div>
          </>
        )}

        {/* Spectrogram Grid settings (only shown if Spectrogram Grid is selected) */}
        {selectedVisuals.spectrogramGrid && (
          <>
            <div className="control-row">
              <div className="slider-container">
                <label>Grid Cell Size: {gridCellSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={gridCellSize}
                  onChange={(e) => setGridCellSize(parseInt(e.target.value))}
                  className="sensitivity-slider"
                />
              </div>
            </div>
            <div className="control-row">
              <div className="slider-container">
                <label>Grid Sensitivity: {gridSensitivity}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={gridSensitivity}
                  onChange={(e) => setGridSensitivity(parseInt(e.target.value))}
                  className="sensitivity-slider"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div ref={canvasContainerRef} className="canvas-container">
        <canvas ref={canvasRef} className="canvas"></canvas>
      </div>

      <audio ref={audioRef} className="audio-element" />
    </div>
  );
}