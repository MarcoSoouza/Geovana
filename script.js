/**
 * Video Exclusivo - Script Principal
 * Gerencia o upload, reprodução e controle de visualização única do vídeo
 */

class VideoExclusivo {
    constructor() {
        this.videoPlayer = document.getElementById('videoPlayer');
        this.videoInput = document.getElementById('videoInput');
        this.selectVideoBtn = document.getElementById('selectVideoBtn');
        this.uploadSection = document.getElementById('uploadSection');
        this.lockOverlay = document.getElementById('lockOverlay');
        this.videoWrapper = document.getElementById('videoWrapper');
        this.videoInfo = document.getElementById('videoInfo');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoDescription = document.getElementById('videoDescription');
        this.removeVideoBtn = document.getElementById('removeVideoBtn');
        this.watchAgainBtn = document.getElementById('watchAgainBtn');
        
        this.storageKey = 'video_exclusivo_data';
        this.watchedKey = 'video_exclusivo_watched';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedVideo();
    }

    setupEventListeners() {
        // Selecionar vídeo através do botão
        this.selectVideoBtn.addEventListener('click', () => {
            this.videoInput.click();
        });

        // Upload de vídeo via input
        this.videoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleVideoUpload(file);
            }
        });

        // Drag and drop
        this.uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadSection.style.borderColor = '#6366F1';
        });

        this.uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadSection.style.borderColor = '';
        });

        this.uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadSection.style.borderColor = '';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                this.handleVideoUpload(file);
            }
        });

        // Quando o vídeo termina de reproduzir
        this.videoPlayer.addEventListener('ended', () => {
            this.markAsWatched();
        });

        // Remover vídeo
        this.removeVideoBtn.addEventListener('click', () => {
            this.removeVideo();
        });

        // Assistir novamente (para demo)
        this.watchAgainBtn.addEventListener('click', () => {
            this.resetWatchedStatus();
        });
    }

    handleVideoUpload(file) {
        // Validar tipo do arquivo
        const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!validTypes.includes(file.type)) {
            alert('Por favor, selecione um vídeo nos formatos: MP4, WebM ou OGG');
            return;
        }

        // Validar tamanho (máximo 500MB)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            alert('O vídeo deve ter no máximo 500MB');
            return;
        }

        const videoURL = URL.createObjectURL(file);
        
        // Salvar dados do vídeo
        const videoData = {
            name: file.name,
            type: file.type,
            size: file.size,
            url: videoURL,
            uploadDate: new Date().toISOString()
        };

        this.saveVideoData(videoData);
        this.displayVideo(videoData);
    }

    displayVideo(videoData) {
        // Configurar source do vídeo
        this.videoPlayer.src = videoData.url;
        
        // Atualizar informações do vídeo
        this.videoTitle.textContent = videoData.name;
        this.videoDescription.textContent = this.formatFileSize(videoData.size);
        
        // Mostrar elementos usando classes
        this.videoWrapper.classList.add('has-video');
        this.videoInfo.classList.remove('hidden');
        this.uploadSection.classList.add('hidden');
        
        // Verificar se já foi assistido
        if (this.hasWatched()) {
            this.showLockedState();
        } else {
            this.lockOverlay.classList.remove('visible');
            // Iniciar reprodução automática
            this.videoPlayer.muted = true;
            this.videoPlayer.play().catch(error => {
                console.log('Autoplay foi bloqueado pelo navegador');
            });
        }
    }

    markAsWatched() {
        localStorage.setItem(this.watchedKey, 'true');
        
        // Remove o vídeo completamente após assistido (sem confirmação)
        this.removeVideo(false);
    }

    showLockedState() {
        this.lockOverlay.classList.add('visible');
        
        // Desabilitar controles do vídeo
        this.videoPlayer.controls = false;
        this.videoPlayer.pause();
        
        // Atualizar badge
        const badge = document.getElementById('watchBadge');
        badge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/>
            </svg>
            Vídeo bloqueado
        `;
        badge.style.background = 'rgba(239, 68, 68, 0.1)';
        badge.style.color = '#EF4444';
    }

    hasWatched() {
        return localStorage.getItem(this.watchedKey) === 'true';
    }

    resetWatchedStatus() {
        localStorage.removeItem(this.watchedKey);
        this.lockOverlay.classList.remove('visible');
        this.videoPlayer.controls = true;
        this.videoPlayer.muted = false;
        
        // Reiniciar vídeo
        this.videoPlayer.currentTime = 0;
        this.videoPlayer.play();
        
        // Atualizar badge
        const badge = document.getElementById('watchBadge');
        badge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8L7 11L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Visualização única
        `;
        badge.style.background = 'rgba(99, 102, 241, 0.1)';
        badge.style.color = '#6366F1';
    }

    saveVideoData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    loadSavedVideo() {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
            try {
                const videoData = JSON.parse(savedData);
                // Verificar se o URL ainda é válido
                if (videoData.url) {
                    this.displayVideo(videoData);
                }
            } catch (e) {
                console.error('Erro ao carregar vídeo salvo:', e);
                this.clearVideoData();
            }
        }
    }

    removeVideo(askConfirmation = true) {
        // Se askConfirmation for true, pergunta confirmação
        if (askConfirmation && !confirm('Tem certeza que deseja remover o vídeo?')) {
            return;
        }
        
        // Limpar dados
        this.clearVideoData();
        
        // Resetar interface usando classes
        this.videoPlayer.src = '';
        this.videoWrapper.classList.remove('has-video');
        this.videoInfo.classList.add('hidden');
        this.uploadSection.classList.remove('hidden');
        this.lockOverlay.classList.remove('visible');
        this.videoInput.value = '';
        
        // Resetar badge
        const badge = document.getElementById('watchBadge');
        badge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8L7 11L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Visualização única
        `;
        badge.style.background = 'rgba(99, 102, 241, 0.1)';
        badge.style.color = '#6366F1';
        
        // Se chamado automaticamente (vídeo assistido), mostra mensagem
        if (!askConfirmation) {
            alert('Vídeo assistido com sucesso! O vídeo foi removido e não pode mais ser visualizado.');
        }
    }

    clearVideoData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.watchedKey);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new VideoExclusivo();
});
