export function createAudioPlaceholder(type: 'whistle' | 'bounce' | 'swish'): HTMLAudioElement {
    const audio = new Audio();
    audio.volume = 0.5;
    
    // 使用 AudioContext 创建简单的音效
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
        case 'whistle':
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            break;
        case 'bounce':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            break;
        case 'swish':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            break;
    }
    
    return audio;
} 