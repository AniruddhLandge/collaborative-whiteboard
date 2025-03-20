import React, { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState(null);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:8080');
        setWs(websocket);

        const canvas = canvasRef.current;
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';
        setContext(ctx);

        // Handle incoming WebSocket messages
        websocket.onmessage = (event) => {
            // Check if event.data is a Blob and convert it to text
            if (event.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const data = JSON.parse(reader.result);
                        drawRemote(ctx, data);
                    } catch (error) {
                        console.error('Error parsing Blob data:', error);
                    }
                };
                reader.readAsText(event.data);
            } else {
                // Assume event.data is a string
                try {
                    const data = JSON.parse(event.data);
                    drawRemote(ctx, data);
                } catch (error) {
                    console.error('Error parsing string data:', error);
                }
            }
        };

        return () => websocket.close();
    }, []);

    const startDrawing = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        context.beginPath();
        context.moveTo(offsetX, offsetY);
        setIsDrawing(true);
        sendDrawingData({ type: 'start', x: offsetX, y: offsetY });
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        context.lineTo(offsetX, offsetY);
        context.stroke();
        sendDrawingData({ type: 'draw', x: offsetX, y: offsetY });
    };

    const stopDrawing = () => {
        context.closePath();
        setIsDrawing(false);
        sendDrawingData({ type: 'stop' });
    };

    const sendDrawingData = (data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    };

    const drawRemote = (ctx, data) => {
        switch (data.type) {
            case 'start':
                ctx.beginPath();
                ctx.moveTo(data.x, data.y);
                break;
            case 'draw':
                ctx.lineTo(data.x, data.y);
                ctx.stroke();
                break;
            case 'stop':
                ctx.closePath();
                break;
            default:
                break;
        }
    };

    return (
        <div className="App">
            <h1>Collaborative Whiteboard</h1>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                style={{ border: '1px solid black' }}
            />
        </div>
    );
}

export default App;