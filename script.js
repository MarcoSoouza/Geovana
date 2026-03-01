/**
 * VideoExclusivo - Script Principal
 * Gerencia upload, reprodução e controle de visualização única
 */

class VideoExclusivo {
    constructor() {
        // Elementos do DOM
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
        this.videoLoading = document.getElementById('videoLoading');
        
        // Chaves do localStorage
        this.storageKey = 'video_exclusivo_data';
        this.watchedKey = 'video_exclusivo_watched';
        
        // Inicializar
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedVideo();
    }

    setupEventListeners() {
        // Selecionar vídeo através do botão
        this.selectVideoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.videoInput.click();
        });

        // Upload de vídeo via input
        this.videoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleVideoUpload(file);
            }
        });

        // Drag and drop na seção de upload
        this.uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadSection.style.transform = 'scale(1.02)';
        });

        this.uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadSection.style.transform = 'scale(1)';
        });

        this.uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadSection.style.transform = 'scale(1)';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                this.handleVideoUpload(file);
            }
        });

        // Quando o vídeo termina de reproduzir
        this.videoPlayer.addEventListener('ended', () => {
            this.markAsWatched();
        });

        // Mostrar loading enquanto o vídeo carrega
        this.videoPlayer.addEventListener('loadstart', () => {
            this.videoLoading.style.display = 'flex';
        });

        this.videoPlayer.addEventListener('canplay', () => {
            this.videoLoading.style.display = 'none';
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
            this.showAlert('Por favor, selecione um vídeo nos formatos: MP4, WebM ou OGG', 'error');
            return;
        }

        // Validar tamanho (máximo 500MB)
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showAlert('O vídeo deve ter no máximo 500MB', 'error');
            return;
        }

        // Criar URL do objeto
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
        
        this.showAlert('Vídeo carregado com sucesso!', 'success');
    }

    displayVideo(videoData) {
        // Configurar source do vídeo
        this.videoPlayer.src = videoData.url;
        
        // Atualizar informações do vídeo
        this.videoTitle.textContent = videoData.name;
        this.videoDescription.textContent = this.formatFileSize(videoData.size);
        
        // Mostrar elementos
        this.videoWrapper.classList.add('has-video');
        this.videoInfo.classList.remove('hidden');
        this.uploadSection.classList.add('hidden');
        
        // Verificar se já foi assistido
        if (this.hasWatched()) {
            this.showLockedState();
        } else {
            this.lockOverlay.style.display = 'none';
            
            // Iniciar reprodução automática
            this.videoPlayer.muted = true;
            this.videoPlayer.play().catch(error => {
                console.log('Autoplay bloqueado pelo navegador');
            });
        }
    }

    markAsWatched() {
        localStorage.setItem(this.watchedKey, 'true');
        
        // Remove o vídeo completamente após assistido
        this.removeVideo(false);
    }

    showLockedState() {
        this.lockOverlay.style.display = 'flex';
        
        // Desabilitar controles do vídeo
        this.videoPlayer.controls = false;
        this.videoPlayer.pause();
    }

    hasWatched() {
        return localStorage.getItem(this.watchedKey) === 'true';
    }

    resetWatchedStatus() {
        localStorage.removeItem(this.watchedKey);
        this.lockOverlay.style.display = 'none';
        this.videoPlayer.controls = true;
        this.videoPlayer.muted = false;
        
        // Reiniciar vídeo
        this.videoPlayer.currentTime = 0;
        this.videoPlayer.play();
        
        // Atualizar badge
        const badge = document.getElementById('watchBadge');
        badge.innerHTML = '<span class="status-dot"></span><span>Uma visualização</span>';
        badge.style.background = 'rgba(139, 92, 246, 0.1)';
        badge.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        badge.style.color = '#A78BFA';
    }

    saveVideoData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    loadSavedVideo() {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
            try {
                const videoData = JSON.parse(savedData);
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
        if (askConfirmation && !confirm('Tem certeza que deseja remover o vídeo?')) {
            return;
        }
        
        // Limpar dados
        this.clearVideoData();
        
        // Resetar interface
        this.videoPlayer.src = '';
        this.videoWrapper.classList.remove('has-video');
        this.videoInfo.classList.add('hidden');
        this.uploadSection.classList.remove('hidden');
        this.lockOverlay.style.display = 'none';
        this.videoInput.value = '';
        this.videoLoading.style.display = 'none';
        
        // Resetar badge
        const badge = document.getElementById('watchBadge');
        badge.innerHTML = '<span class="status-dot"></span><span>Uma visualização</span>';
        badge.style.background = 'rgba(139, 92, 246, 0.1)';
        badge.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        badge.style.color = '#A78BFA';
        
        // Se chamado automaticamente (vídeo assistido), mostra mensagem
        if (!askConfirmation) {
            this.showAlert('Vídeo assistido com sucesso! O vídeo foi removido.', 'success');
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

    showAlert(message, type = 'info') {
        // Remover alertas existentes
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Criar elemento de alerta
        const alert = document.createElement('div');
        alert.className = `custom-alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Estilos do alerta
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(139, 92, 246, 0.95)'};
            color: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 15px;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

        // Adicionar animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(alert);

        // Remover após 3 segundos
        setTimeout(() => {
            alert.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }
}

// Adicionar estilos de animação globais
const globalStyles = document.createElement('style');
globalStyles.textContent = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: 'Outfit', sans-serif;
    }
`;
document.head.appendChild(globalStyles);

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new VideoExclusivo();
});
