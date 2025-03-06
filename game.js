// Configurações do jogo
let gameConfig = {
    timeOfDay: 'day',
    weaponColor: '#4a5a6a',
    weaponTexture: 'digital'
};

// Estado do jogo
let gameStarted = false;
let previewAnimationId = null;
let gameAnimationId = null;

// Configuração do labirinto
const MAZE_SIZE = 15;
const WALL_HEIGHT = 2;
const CELL_SIZE = 2;

// Configuração dos ETs
const ET_COUNT = 5; // Quantidade de ETs no labirinto
const ET_SPEED = 0.03; // Velocidade de movimento
const ET_SIZE = 0.4; // Tamanho do ET
const ET_HEIGHT = 1.2; // Altura do ET
let aliens = []; // Array para armazenar os ETs

// Configuração das nuvens
const CLOUD_COUNT = 30;
const CLOUD_SIZE = 3;
const CLOUD_HEIGHT = 10;

// Configuração das partículas
const DUST_PARTICLE_COUNT = 200;
const DUST_PARTICLE_SIZE = 0.03;
const FLOATING_PARTICLE_COUNT = 100;
const FLOATING_PARTICLE_SIZE = 0.02;

// Configuração do mouse
let isPointerLocked = false;
let mouseSensitivity = 0.002;

// Configuração da câmera
let cameraRotation = {
    pitch: 0,
    yaw: 0
};

// Configuração da física
const JUMP_FORCE = 0.15;
const GRAVITY = 0.006;
const PLAYER_HEIGHT = 1;

// Carregador de texturas
const textureLoader = new THREE.TextureLoader();

// Configuração das marcas de tiro
const BULLET_MARK_SIZE = 0.08;
const MAX_BULLET_MARKS = 50;
let bulletMarks = [];

// Configuração do tiro
let canShoot = true;
const SHOOT_COOLDOWN = 100; // Tempo entre tiros (ms)
const RECOIL_FORCE = 0.1; // Força do recuo
const RECOIL_RECOVERY = 0.1; // Velocidade de recuperação do recuo
let recoilOffset = { x: 0, y: 0, z: 0 };
let lastShootTime = 0;
let shotsFired = 0;
let lastShotSequenceTime = 0;
let smokeParticles = null;
let shootSound = null; // Som do tiro pré-carregado

// Definição do labirinto (0 = caminho, 1 = parede, 2 = início, 3 = fim)
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Configuração da cena
let scene, camera, renderer;
let walls = [];
let clouds = [];
let dustParticles = [];
let floatingParticles = [];
let playerPosition = { x: 0, y: PLAYER_HEIGHT, z: 0 };
let playerVelocity = { x: 0, y: 0, z: 0 };
let isJumping = false;
let moveSpeed = 0.1;
let rotationSpeed = 0.03;

// Configuração da arma
let weapon;
let isWeaponBobbing = false;
let weaponBobTime = 0;
const WEAPON_BOB_SPEED = 0.1;
const WEAPON_BOB_AMOUNT = 0.02;

// Inicialização do jogo
function init() {
    // Configurar eventos do menu
    document.getElementById('timeOfDay').addEventListener('change', (e) => {
        gameConfig.timeOfDay = e.target.value;
        if (scene) {
            updateTimeOfDay();
        }
    });

    document.getElementById('weaponColor').addEventListener('change', (e) => {
        gameConfig.weaponColor = e.target.value;
        if (weapon) {
            updateWeaponAppearance();
        }
    });

    document.getElementById('weaponTexture').addEventListener('change', (e) => {
        gameConfig.weaponTexture = e.target.value;
        if (weapon) {
            updateWeaponAppearance();
        }
    });

    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('backButton').addEventListener('click', returnToMenu);

    // Criar cena inicial apenas para preview
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Posicionar câmera para preview
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
    
    // Aplicar configuração inicial de iluminação
    updateTimeOfDay();
    
    // Iniciar loop de preview
    animatePreview();
}

// Loop de animação para preview
function animatePreview() {
    if (!gameStarted) {
        previewAnimationId = requestAnimationFrame(animatePreview);
        if (scene) {
            renderer.render(scene, camera);
        }
    }
}

// Função para iniciar o jogo
function startGame() {
    // Cancelar animação de preview se estiver rodando
    if (previewAnimationId !== null) {
        cancelAnimationFrame(previewAnimationId);
        previewAnimationId = null;
    }
    
    gameStarted = true;
    
    // Limpar cena existente
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    // Configurar renderer para o jogo
    renderer.setClearColor(0x87CEEB, 1);
    
    // Esconder menu e mostrar botão de retorno
    document.getElementById('gameMenu').style.display = 'none';
    document.getElementById('backButton').style.display = 'block';
    
    // Remover crosshair existente se houver
    const oldCrosshair = document.getElementById('crosshair');
    if (oldCrosshair) {
        oldCrosshair.remove();
    }

    // Inicializar componentes do jogo
    initializeGame();
}

// Função para retornar ao menu principal
function returnToMenu() {
    // Cancelar animação do jogo se estiver rodando
    if (gameAnimationId !== null) {
        cancelAnimationFrame(gameAnimationId);
        gameAnimationId = null;
    }
    
    gameStarted = false;
    
    // Limpar cena
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    // Restaurar configurações iniciais
    renderer.setClearColor(0x000000, 0);
    
    // Mostrar menu e esconder botão de retorno
    document.getElementById('gameMenu').style.display = 'block';
    document.getElementById('backButton').style.display = 'none';
    
    // Remover crosshair se existir
    const oldCrosshair = document.getElementById('crosshair');
    if (oldCrosshair) {
        oldCrosshair.remove();
    }
    
    // Desbloquear o ponteiro
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
    
    // Reiniciar preview
    init();
}

// Função para inicializar o jogo
function initializeGame() {
    // Pré-carregar som do tiro
    shootSound = new Audio('pistol-sound.mp3');
    shootSound.volume = 0.3;
    shootSound.load();

    // Configurar renderer com sombras
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Posicionar câmera para o jogo
    camera.position.set(1, PLAYER_HEIGHT, 1);

    // Criar o alvo (crosshair)
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    crosshair.style.position = 'fixed';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.width = '20px';
    crosshair.style.height = '20px';
    crosshair.style.backgroundColor = 'transparent';
    crosshair.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    crosshair.style.borderRadius = '50%';
    crosshair.style.pointerEvents = 'none';
    crosshair.style.zIndex = '1000';
    crosshair.style.transition = 'none';

    // Ponto central do alvo
    const centerDot = document.createElement('div');
    centerDot.style.position = 'absolute';
    centerDot.style.top = '50%';
    centerDot.style.left = '50%';
    centerDot.style.transform = 'translate(-50%, -50%)';
    centerDot.style.width = '4px';
    centerDot.style.height = '4px';
    centerDot.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    centerDot.style.borderRadius = '50%';
    crosshair.appendChild(centerDot);
    document.body.appendChild(crosshair);

    // Criar arma
    createWeapon();

    // Atualizar rotação da câmera
    updateCameraRotation();

    // Criar textura de grama procedural
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 256;
    grassCanvas.height = 256;
    const ctx = grassCanvas.getContext('2d');

    // Cor base da grama
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, 256, 256);

    // Adicionar variação de cor para criar textura
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 3 + 1;
        
        // Variação aleatória de cores de grama
        const colors = ['#2d5a27', '#3a7034', '#1f3f1c', '#4c9141'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 2 - 1, y + size);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Criar textura a partir do canvas
    const grassTexture = new THREE.CanvasTexture(grassCanvas);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(8, 8);

    // Criar chão com textura de grama
    const floorGeometry = new THREE.PlaneGeometry(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: grassTexture,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Criar paredes do labirinto
    createMaze();

    // Criar nuvens
    createClouds();

    // Criar partículas
    createDustParticles();
    createFloatingParticles();

    // Aplicar configurações de iluminação baseadas no período do dia
    updateTimeOfDay();

    // Configurar controles
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('click', onMouseClick);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Carregar marcas de tiro salvas
    loadBulletMarks();

    // Criar ETs
    for (let i = 0; i < ET_COUNT; i++) {
        const position = findValidPosition();
        createAlien(position);
    }

    // Iniciar loop de animação principal
    animate();
}

// Função para atualizar período do dia
function updateTimeOfDay() {
    if (!scene) return;

    // Remover todas as luzes existentes
    scene.children.forEach(child => {
        if (child instanceof THREE.Light) {
            scene.remove(child);
        }
    });

    switch (gameConfig.timeOfDay) {
        case 'day':
            scene.background = new THREE.Color(0x87CEEB);
            updateLighting(1, 0.3, new THREE.Color(0xffffff));
            break;
        case 'sunset':
            scene.background = new THREE.Color(0xff7f50);
            updateLighting(0.7, 0.5, new THREE.Color(0xffa07a));
            break;
        case 'night':
            scene.background = new THREE.Color(0x000033);
            updateLighting(0.1, 0.8, new THREE.Color(0x3333ff));
            break;
    }
}

// Função para atualizar iluminação
function updateLighting(intensity, ambientIntensity, color) {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(color, ambientIntensity);
    scene.add(ambientLight);

    if (gameConfig.timeOfDay === 'night') {
        // Iluminação noturna
        const moonLight = new THREE.DirectionalLight(0x3333ff, 0.2);
        moonLight.position.set(15, 30, 15);
        moonLight.castShadow = true;
        scene.add(moonLight);

        // Adicionar algumas estrelas
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 1000;
            const y = Math.random() * 500;
            const z = (Math.random() - 0.5) * 1000;
            starVertices.push(x, y, z);
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
    } else {
        // Luz principal (sol/pôr do sol)
        const mainLight = new THREE.DirectionalLight(color, intensity);
        mainLight.position.set(15, 30, 15);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 100;
        mainLight.shadow.camera.left = -20;
        mainLight.shadow.camera.right = 20;
        mainLight.shadow.camera.top = 20;
        mainLight.shadow.camera.bottom = -20;
        mainLight.shadow.bias = -0.0005;
        scene.add(mainLight);
    }
}

// Função para criar textura da arma
function createWeaponTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const baseColor = gameConfig.weaponColor;

    switch (gameConfig.weaponTexture) {
        case 'digital':
            createDigitalCamo(ctx, baseColor);
            break;
        case 'urban':
            createUrbanCamo(ctx, baseColor);
            break;
        case 'desert':
            createDesertCamo(ctx, baseColor);
            break;
        case 'metal':
            createMetalTexture(ctx, baseColor);
            break;
    }

    return new THREE.CanvasTexture(canvas);
}

// Funções para criar diferentes texturas
function createDigitalCamo(ctx, baseColor) {
    // Converter cor hex para RGB
    const color = new THREE.Color(baseColor);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    // Cores da camuflagem digital
    const colors = [
        `rgb(${r},${g},${b})`,
        `rgb(${r*0.8},${g*0.8},${b*0.8})`,
        `rgb(${r*0.6},${g*0.6},${b*0.6})`,
        `rgb(${r*0.4},${g*0.4},${b*0.4})`
    ];

    // Preencher com cor base
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, 256, 256);

    // Criar padrão digital
    const sizes = [32, 16, 8];
    sizes.forEach(size => {
        for (let y = 0; y < 256; y += size) {
            for (let x = 0; x < 256; x += size) {
                if (Math.random() > 0.5) {
                    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    ctx.fillRect(x, y, size, size);
                }
            }
        }
    });
}

function createUrbanCamo(ctx, baseColor) {
    const color = new THREE.Color(baseColor);
    const colors = [
        `rgb(${color.r*255},${color.g*255},${color.b*255})`,
        '#808080',
        '#404040',
        '#000000'
    ];

    // Base
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, 256, 256);

    // Padrões irregulares
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
            ctx.lineTo(
                x + (Math.random() - 0.5) * 100,
                y + (Math.random() - 0.5) * 100
            );
        }
        ctx.closePath();
        ctx.fill();
    }
}

function createDesertCamo(ctx, baseColor) {
    const colors = [
        baseColor,
        '#d4b996',
        '#c2b280',
        '#8b7355'
    ];

    // Base
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, 256, 256);

    // Manchas orgânicas
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = 20 + Math.random() * 40;
        ctx.ellipse(x, y, radius, radius * 0.6, Math.random() * Math.PI * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createMetalTexture(ctx, baseColor) {
    const color = new THREE.Color(baseColor);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    // Gradiente metálico
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, `rgb(${r*1.2},${g*1.2},${b*1.2})`);
    gradient.addColorStop(0.5, `rgb(${r},${g},${b})`);
    gradient.addColorStop(1, `rgb(${r*0.8},${g*0.8},${b*0.8})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Adicionar arranhões
    for (let i = 0; i < 50; i++) {
        ctx.strokeStyle = `rgba(255,255,255,0.1)`;
        ctx.beginPath();
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20);
        ctx.stroke();
    }
}

// Função para atualizar aparência da arma
function updateWeaponAppearance() {
    if (!weapon) return;

    const newTexture = createWeaponTexture();
    weapon.children.forEach(part => {
        if (part.material && part.material.map) {
            part.material.map = newTexture;
            part.material.needsUpdate = true;
        }
    });
}

// Criar paredes do labirinto
function createMaze() {
    // Criar textura de tijolos procedural
    const brickCanvas = document.createElement('canvas');
    brickCanvas.width = 256;
    brickCanvas.height = 256;
    const ctx = brickCanvas.getContext('2d');

    // Cor base dos tijolos
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 256, 256);

    // Desenhar tijolos
    const brickHeight = 20;
    const brickWidth = 40;
    const gap = 2;

    for (let y = 0; y < 256; y += brickHeight + gap) {
        // Deslocar fileiras alternadas
        const offset = (Math.floor(y / (brickHeight + gap)) % 2) * (brickWidth / 2);
        
        for (let x = -brickWidth; x < 256 + brickWidth; x += brickWidth + gap) {
            // Variação de cores para os tijolos
            const variation = Math.random() * 20 - 10;
            const r = Math.min(Math.max(139 + variation, 120), 160);
            const g = Math.min(Math.max(69 + variation, 50), 90);
            const b = Math.min(Math.max(19 + variation, 0), 40);
            
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x + offset, y, brickWidth, brickHeight);

            // Adicionar textura aos tijolos
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < 20; i++) {
                const spotX = x + offset + Math.random() * brickWidth;
                const spotY = y + Math.random() * brickHeight;
                ctx.beginPath();
                ctx.arc(spotX, spotY, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Adicionar sombras entre os tijolos
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let y = 0; y < 256; y += brickHeight + gap) {
        for (let x = 0; x < 256; x += brickWidth + gap) {
            ctx.fillRect(x - 1, y - 1, brickWidth + 2, gap + 2);
            ctx.fillRect(x - 1, y - 1, gap + 2, brickHeight + 2);
        }
    }

    // Criar textura a partir do canvas
    const brickTexture = new THREE.CanvasTexture(brickCanvas);
    brickTexture.wrapS = THREE.RepeatWrapping;
    brickTexture.wrapT = THREE.RepeatWrapping;
    brickTexture.repeat.set(1, 1);

    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        map: brickTexture,
        roughness: 0.9,
        metalness: 0.1,
        bumpMap: brickTexture,
        bumpScale: 0.1,
        envMapIntensity: 0.5
    });

    for (let z = 0; z < MAZE_SIZE; z++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
            if (maze[z][x] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(
                    x * CELL_SIZE - (MAZE_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2,
                    WALL_HEIGHT / 2,
                    z * CELL_SIZE - (MAZE_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2
                );
                wall.castShadow = true;
                wall.receiveShadow = true;
                scene.add(wall);
                walls.push(wall);
            }
        }
    }
}

// Criar nuvens
function createClouds() {
    const cloudGeometry = new THREE.SphereGeometry(CLOUD_SIZE, 8, 8);
    const cloudMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        roughness: 1,
        metalness: 0
    });

    for (let i = 0; i < CLOUD_COUNT; i++) {
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        cloud.position.x = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
        cloud.position.y = CLOUD_HEIGHT + Math.random() * 5;
        cloud.position.z = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
        
        cloud.userData.speed = 0.002 + Math.random() * 0.004;
        cloud.userData.initialX = cloud.position.x;
        
        cloud.castShadow = true;
        scene.add(cloud);
        clouds.push(cloud);
    }
}

// Atualizar posição das nuvens
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed;
        
        // Resetar posição quando a nuvem sair da tela
        if (cloud.position.x > MAZE_SIZE * CELL_SIZE / 2) {
            cloud.position.x = -MAZE_SIZE * CELL_SIZE / 2;
        }
    });
}

// Controles do teclado
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let rotateLeft = false;
let rotateRight = false;

function onKeyDown(event) {
    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
            rotateLeft = true;
            break;
        case 'ArrowRight':
            rotateRight = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (!isJumping) {
                playerVelocity.y = JUMP_FORCE;
                isJumping = true;
            }
            break;
        case 'Escape':
            window.close();
            break;
    }
}

function onKeyUp(event) {
    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
            rotateLeft = false;
            break;
        case 'ArrowRight':
            rotateRight = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// Controles do mouse
function onMouseClick(event) {
    if (!gameStarted) return; // Ignorar cliques antes do jogo começar
    
    if (!isPointerLocked) {
        renderer.domElement.requestPointerLock();
    } else {
        // Verificar se pode atirar (cooldown)
        const currentTime = Date.now();
        if (currentTime - lastShootTime >= SHOOT_COOLDOWN) {
            shoot();
            lastShootTime = currentTime;
        }
    }
}

function onPointerLockChange() {
    isPointerLocked = document.pointerLockElement === renderer.domElement;
}

function onMouseMove(event) {
    if (isPointerLocked) {
        // Atualizar rotação
        cameraRotation.yaw -= event.movementX * mouseSensitivity;
        cameraRotation.pitch -= event.movementY * mouseSensitivity;
        
        // Limitar rotação vertical
        cameraRotation.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotation.pitch));
        
        // Aplicar rotação à câmera
        updateCameraRotation();
    }
}

// Atualizar rotação da câmera
function updateCameraRotation() {
    // Criar quaternions para rotação
    const pitchQuaternion = new THREE.Quaternion();
    pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), cameraRotation.pitch);
    
    const yawQuaternion = new THREE.Quaternion();
    yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation.yaw);
    
    // Combinar as rotações
    const finalQuaternion = yawQuaternion.multiply(pitchQuaternion);
    
    // Aplicar a rotação à câmera
    camera.quaternion.copy(finalQuaternion);
}

// Atualizar física do jogador
function updatePlayerPhysics() {
    // Aplicar gravidade
    playerVelocity.y -= GRAVITY;
    
    // Atualizar posição vertical
    camera.position.y += playerVelocity.y;
    
    // Verificar colisão com o chão
    if (camera.position.y <= PLAYER_HEIGHT) {
        camera.position.y = PLAYER_HEIGHT;
        playerVelocity.y = 0;
        isJumping = false;
    }
}

// Atualizar posição do jogador
function updatePlayer() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    if (moveForward) {
        const newX = camera.position.x + direction.x * moveSpeed;
        const newZ = camera.position.z + direction.z * moveSpeed;
        if (!checkCollision(newX, newZ)) {
            camera.position.x = newX;
            camera.position.z = newZ;
        }
    }
    if (moveBackward) {
        const newX = camera.position.x - direction.x * moveSpeed;
        const newZ = camera.position.z - direction.z * moveSpeed;
        if (!checkCollision(newX, newZ)) {
            camera.position.x = newX;
            camera.position.z = newZ;
        }
    }
    if (moveLeft) {
        const newX = camera.position.x + direction.z * moveSpeed;
        const newZ = camera.position.z - direction.x * moveSpeed;
        if (!checkCollision(newX, newZ)) {
            camera.position.x = newX;
            camera.position.z = newZ;
        }
    }
    if (moveRight) {
        const newX = camera.position.x - direction.z * moveSpeed;
        const newZ = camera.position.z + direction.x * moveSpeed;
        if (!checkCollision(newX, newZ)) {
            camera.position.x = newX;
            camera.position.z = newZ;
        }
    }

    // Atualizar física do jogador
    updatePlayerPhysics();

    // Verificar vitória
    const gridX = Math.floor((camera.position.x + (MAZE_SIZE * CELL_SIZE) / 2) / CELL_SIZE);
    const gridZ = Math.floor((camera.position.z + (MAZE_SIZE * CELL_SIZE) / 2) / CELL_SIZE);
    if (maze[gridZ][gridX] === 3) {
        alert('Parabéns! Você venceu!');
        window.close();
    }
}

// Verificar colisão com paredes
function checkCollision(x, z) {
    const gridX = Math.floor((x + (MAZE_SIZE * CELL_SIZE) / 2) / CELL_SIZE);
    const gridZ = Math.floor((z + (MAZE_SIZE * CELL_SIZE) / 2) / CELL_SIZE);
    return maze[gridZ][gridX] === 1;
}

// Criar partículas de poeira
function createDustParticles() {
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
        // Posição aleatória dentro do labirinto
        const x = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
        const y = Math.random() * WALL_HEIGHT;
        const z = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
        
        positions.push(x, y, z);
        
        // Velocidade aleatória para movimento suave
        velocities.push(
            (Math.random() - 0.5) * 0.002,
            (Math.random() - 0.5) * 0.001,
            (Math.random() - 0.5) * 0.002
        );
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: DUST_PARTICLE_SIZE,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    
    // Armazenar velocidades e partículas para animação
    particles.userData.velocities = velocities;
    dustParticles.push(particles);
}

// Criar partículas flutuantes (mais brilhantes e lentas)
function createFloatingParticles() {
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < FLOATING_PARTICLE_COUNT; i++) {
        const x = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
        const y = Math.random() * WALL_HEIGHT;
        const z = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
        
        positions.push(x, y, z);
        
        // Velocidade mais lenta para efeito flutuante
        velocities.push(
            (Math.random() - 0.5) * 0.001,
            Math.random() * 0.0005,
            (Math.random() - 0.5) * 0.001
        );
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffcc,
        size: FLOATING_PARTICLE_SIZE,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    
    particles.userData.velocities = velocities;
    floatingParticles.push(particles);
}

// Criar sistema de partículas de fumaça
function createSmokeParticles() {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        
        velocities[i * 3] = (Math.random() - 0.5) * 0.01;
        velocities[i * 3 + 1] = Math.random() * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
        
        lifetimes[i] = 0;
        opacities[i] = 0.5; // Opacidade inicial
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0x888888,
        size: 0.05,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.velocities = velocities;
    particles.userData.lifetimes = lifetimes;
    particles.userData.opacities = opacities;
    particles.userData.isActive = false;
    particles.userData.fadeOutTime = 3; // Tempo total para desaparecer em segundos
    
    return particles;
}

// Criar modelo da arma M4
function createWeapon() {
    // Criar textura personalizada
    const weaponTexture = createWeaponTexture();

    // Criar geometria da arma
    const gunBody = new THREE.Group();

    // Corpo principal da arma
    const bodyGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        map: weaponTexture,
        roughness: 0.7,
        metalness: 0.3,
        bumpMap: weaponTexture,
        bumpScale: 0.02
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    gunBody.add(body);

    // Carregador
    const magazineGeometry = new THREE.BoxGeometry(0.12, 0.25, 0.15);
    const magazineMaterial = new THREE.MeshStandardMaterial({ 
        map: weaponTexture,
        roughness: 0.7,
        metalness: 0.3,
        bumpMap: weaponTexture,
        bumpScale: 0.02
    });
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
    magazine.position.set(0, -0.18, 0);
    gunBody.add(magazine);

    // Coronha
    const stockGeometry = new THREE.BoxGeometry(0.12, 0.18, 0.3);
    const stockMaterial = new THREE.MeshStandardMaterial({ 
        map: weaponTexture,
        roughness: 0.7,
        metalness: 0.3,
        bumpMap: weaponTexture,
        bumpScale: 0.02
    });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, 0, 0.5);
    gunBody.add(stock);

    // Cano (mantido metálico)
    const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6);
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        roughness: 0.5,
        metalness: 0.8
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.4);
    gunBody.add(barrel);

    // Mira
    const sightGeometry = new THREE.BoxGeometry(0.03, 0.08, 0.03);
    const sightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        roughness: 0.7,
        metalness: 0.6
    });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.set(0, 0.11, -0.35);
    gunBody.add(sight);

    // Posicionar a arma na cena
    gunBody.scale.set(1.5, 1.5, 1.5);
    gunBody.position.set(0.4, -0.15, -0.4);
    gunBody.rotation.set(0, -Math.PI / 24, 0);
    
    camera.add(gunBody);
    scene.add(camera);
    weapon = gunBody;

    // Luz específica para a arma
    const gunLight = new THREE.PointLight(0xffffff, 0.5, 2);
    gunLight.position.set(0.3, 0.2, -0.5);
    camera.add(gunLight);

    // Adicionar sistema de partículas de fumaça
    smokeParticles = createSmokeParticles();
    smokeParticles.position.set(0, 0.03, -0.7); // Posicionar na ponta do cano
    weapon.add(smokeParticles);
}

// Função de tiro
function shoot() {
    if (!weapon) return;

    const currentTime = Date.now();
    
    // Criar raycaster para detectar onde o tiro atinge
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);
    
    // Verificar colisão com ETs
    const alienIntersects = raycaster.intersectObjects(aliens, true);
    
    if (alienIntersects.length > 0) {
        // Encontrar o ET pai do objeto atingido
        let hitAlien = alienIntersects[0].object;
        while (hitAlien.parent && !aliens.includes(hitAlien)) {
            hitAlien = hitAlien.parent;
        }
        
        if (aliens.includes(hitAlien)) {
            hitAlien.userData.health -= 50; // Dano do tiro
            
            // Efeito de hit
            const hitPosition = alienIntersects[0].point;
            createHitEffect(hitPosition);
        }
    } else {
        // Verificar colisão com paredes
        const wallIntersects = raycaster.intersectObjects(walls);
        if (wallIntersects.length > 0) {
            createBulletMark(wallIntersects[0].point, wallIntersects[0].face.normal);
        }
    }

    // Efeito de recuo mais intenso no crosshair
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        // Aplicar transformação de recuo mais forte
        const recoilY = RECOIL_FORCE * 100; // Aumentado de 50 para 100
        const recoilX = (Math.random() - 0.5) * RECOIL_FORCE * 40; // Aumentado de 20 para 40
        crosshair.style.transform = `translate(calc(-50% + ${recoilX}px), calc(-50% + ${recoilY}px))`;
        
        // Restaurar posição gradualmente
        setTimeout(() => {
            crosshair.style.transform = `translate(-50%, -50%)`;
        }, 50);
    }

    // Verificar sequência de tiros
    if (currentTime - lastShotSequenceTime > 3000) {
        // Resetar contagem se passou mais de 3 segundos
        shotsFired = 1;
        lastShotSequenceTime = currentTime;
    } else {
        shotsFired++;
        
        // Ativar fumaça após 5 tiros
        if (shotsFired >= 5 && smokeParticles) {
            smokeParticles.userData.isActive = true;
            
            // Resetar partículas
            const positions = smokeParticles.geometry.attributes.position.array;
            const lifetimes = smokeParticles.userData.lifetimes;
            const opacities = smokeParticles.userData.opacities;
            
            for (let i = 0; i < lifetimes.length; i++) {
                lifetimes[i] = 2.0; // Tempo de vida fixo de 2 segundos
                positions[i * 3] = (Math.random() - 0.5) * 0.1; // Dispersão inicial
                positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
                opacities[i] = 0.5; // Opacidade inicial
            }
            
            // Garantir que o material comece visível
            smokeParticles.material.opacity = 0.5;
        }
    }

    // Criar flash do tiro
    const flashGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.set(0, 0.03, -0.7); // Posicionar na ponta do cano
    weapon.add(flash);

    // Som do tiro
    if (shootSound) {
        shootSound.currentTime = 0; // Reiniciar o som para permitir tiros rápidos
        shootSound.play();
    }

    // Aplicar recuo
    recoilOffset.z = RECOIL_FORCE;
    weapon.position.z += RECOIL_FORCE;
    weapon.rotation.x += RECOIL_FORCE * 0.5;

    // Remover o flash após 50ms
    setTimeout(() => {
        weapon.remove(flash);
        flash.geometry.dispose();
        flash.material.dispose();
    }, 50);
}

// Função para criar marca de tiro
function createBulletMark(position, normal) {
    // Criar textura procedural para a marca de tiro
    const markCanvas = document.createElement('canvas');
    markCanvas.width = 64;
    markCanvas.height = 64;
    const ctx = markCanvas.getContext('2d');
    
    // Gradiente radial para simular o impacto
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');    // Centro mais escuro
    gradient.addColorStop(0.3, 'rgba(20, 20, 20, 0.4)'); // Meio termo
    gradient.addColorStop(0.7, 'rgba(40, 40, 40, 0.2)'); // Borda mais clara
    gradient.addColorStop(1, 'rgba(60, 60, 60, 0)');     // Transparente na borda
    
    // Aplicar gradiente
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    // Adicionar textura de impacto
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 28; // Raio menor que 32 para manter dentro do círculo
        const x = 32 + Math.cos(angle) * distance;
        const y = 32 + Math.sin(angle) * distance;
        const size = Math.random() * 3 + 1;
        
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Criar textura Three.js
    const markTexture = new THREE.CanvasTexture(markCanvas);
    
    // Criar geometria da marca de tiro
    const markGeometry = new THREE.CircleGeometry(BULLET_MARK_SIZE, 16); // Aumentado número de segmentos
    const markMaterial = new THREE.MeshBasicMaterial({
        map: markTexture,
        transparent: true,
        opacity: 0.7, // Reduzido de 0.8 para 0.7
        depthWrite: false,
        side: THREE.DoubleSide
    });
    
    const mark = new THREE.Mesh(markGeometry, markMaterial);
    
    // Posicionar a marca ligeiramente acima da superfície
    mark.position.copy(position).addScaledVector(normal, 0.002); // Aumentado de 0.001 para 0.002
    
    // Rotacionar a marca para alinhar com a superfície
    mark.lookAt(position.clone().add(normal));
    
    // Rotação aleatória para variar a aparência
    mark.rotation.z = Math.random() * Math.PI * 2;
    
    scene.add(mark);
    bulletMarks.push(mark);
    
    // Remover marcas antigas se exceder o limite
    if (bulletMarks.length > MAX_BULLET_MARKS) {
        const oldestMark = bulletMarks.shift();
        scene.remove(oldestMark);
        oldestMark.geometry.dispose();
        oldestMark.material.dispose();
        if (oldestMark.material.map) {
            oldestMark.material.map.dispose();
        }
    }
    
    // Salvar as posições das marcas de tiro localmente
    saveBulletMarks();
}

// Função para salvar as marcas de tiro
function saveBulletMarks() {
    const marksData = bulletMarks.map(mark => ({
        position: {
            x: mark.position.x,
            y: mark.position.y,
            z: mark.position.z
        },
        rotation: {
            x: mark.rotation.x,
            y: mark.rotation.y,
            z: mark.rotation.z
        }
    }));
    
    localStorage.setItem('bulletMarks', JSON.stringify(marksData));
}

// Função para carregar as marcas de tiro salvas
function loadBulletMarks() {
    const savedMarks = localStorage.getItem('bulletMarks');
    if (savedMarks) {
        const marksData = JSON.parse(savedMarks);
        
        marksData.forEach(data => {
            // Criar textura procedural para a marca de tiro
            const markCanvas = document.createElement('canvas');
            markCanvas.width = 64;
            markCanvas.height = 64;
            const ctx = markCanvas.getContext('2d');
            
            // Gradiente radial para simular o impacto
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
            gradient.addColorStop(0.3, 'rgba(20, 20, 20, 0.4)');
            gradient.addColorStop(0.7, 'rgba(40, 40, 40, 0.2)');
            gradient.addColorStop(1, 'rgba(60, 60, 60, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            
            // Adicionar textura de impacto
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 28;
                const x = 32 + Math.cos(angle) * distance;
                const y = 32 + Math.sin(angle) * distance;
                const size = Math.random() * 3 + 1;
                
                ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const markTexture = new THREE.CanvasTexture(markCanvas);
            
            const markGeometry = new THREE.CircleGeometry(BULLET_MARK_SIZE, 16);
            const markMaterial = new THREE.MeshBasicMaterial({
                map: markTexture,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            
            const mark = new THREE.Mesh(markGeometry, markMaterial);
            mark.position.set(data.position.x, data.position.y, data.position.z);
            mark.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            
            scene.add(mark);
            bulletMarks.push(mark);
        });
    }
}

// Atualizar movimento da arma
function updateWeapon() {
    if (!weapon) return;

    // Atualizar partículas de fumaça
    if (smokeParticles && smokeParticles.userData.isActive) {
        const positions = smokeParticles.geometry.attributes.position.array;
        const velocities = smokeParticles.userData.velocities;
        const lifetimes = smokeParticles.userData.lifetimes;
        const opacities = smokeParticles.userData.opacities;
        let allParticlesDead = true;
        
        for (let i = 0; i < lifetimes.length; i++) {
            if (lifetimes[i] > 0) {
                // Atualizar posição
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];
                
                // Diminuir tempo de vida
                lifetimes[i] -= 0.016; // Aproximadamente 60 FPS
                
                // Calcular opacidade baseada no tempo de vida
                opacities[i] = Math.max(0, lifetimes[i] / 2) * 0.5;
                
                if (lifetimes[i] > 0) {
                    allParticlesDead = false;
                }
            }
        }
        
        // Atualizar opacidade do material
        smokeParticles.material.opacity = Math.max(...opacities);
        
        if (allParticlesDead) {
            smokeParticles.userData.isActive = false;
            smokeParticles.material.opacity = 0;
            
            // Resetar sistema de fumaça
            shotsFired = 0;
            lastShotSequenceTime = 0;
        }
        
        smokeParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Movimento de balanço ao andar
    if (moveForward || moveBackward || moveLeft || moveRight) {
        isWeaponBobbing = true;
    } else {
        isWeaponBobbing = false;
    }

    if (isWeaponBobbing) {
        weaponBobTime += WEAPON_BOB_SPEED;
        weapon.position.y = -0.15 + Math.sin(weaponBobTime) * WEAPON_BOB_AMOUNT;
        weapon.position.x = 0.4 + Math.cos(weaponBobTime) * WEAPON_BOB_AMOUNT * 0.5;
    } else {
        // Suavemente retornar à posição original
        weapon.position.y += (-0.15 - weapon.position.y) * 0.1;
        weapon.position.x += (0.4 - weapon.position.x) * 0.1;
    }

    // Recuperação do recuo
    recoilOffset.z *= (1 - RECOIL_RECOVERY);
    weapon.position.z += ((-0.4 - weapon.position.z) * RECOIL_RECOVERY);
    weapon.rotation.x += (0 - weapon.rotation.x) * RECOIL_RECOVERY;

    // Efeito de recuo ao pular
    if (isJumping) {
        weapon.rotation.x = -playerVelocity.y * 0.4;
    }

    // Atualizar posição do crosshair com movimento mais intenso
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        let finalX = -50;
        let finalY = -50;
        
        // Adicionar efeito de balanço ao andar
        if (isWeaponBobbing) {
            const bobOffset = Math.sin(weaponBobTime) * WEAPON_BOB_AMOUNT * 60; // Aumentado de 30 para 60
            const sideOffset = Math.cos(weaponBobTime) * WEAPON_BOB_AMOUNT * 30; // Aumentado de 15 para 30
            finalX += sideOffset;
            finalY += bobOffset;
        }
        
        // Adicionar efeito de recuo
        if (recoilOffset.z > 0.01) {
            finalY += recoilOffset.z * 100; // Aumentado de 50 para 100
        }
        
        // Adicionar efeito ao pular
        if (isJumping) {
            finalY += playerVelocity.y * 60; // Aumentado de 30 para 60
        }
        
        // Aplicar todas as transformações
        crosshair.style.transform = `translate(${finalX}%, ${finalY}%)`;
    }
}

// Atualizar partículas
function updateParticles() {
    // Atualizar partículas de poeira
    dustParticles.forEach(particles => {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Resetar posição se a partícula sair do labirinto
            if (Math.abs(positions[i]) > MAZE_SIZE * CELL_SIZE / 2) {
                positions[i] = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
            }
            if (positions[i + 1] < 0 || positions[i + 1] > WALL_HEIGHT) {
                positions[i + 1] = Math.random() * WALL_HEIGHT;
            }
            if (Math.abs(positions[i + 2]) > MAZE_SIZE * CELL_SIZE / 2) {
                positions[i + 2] = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
            }
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
    });
    
    // Atualizar partículas flutuantes
    floatingParticles.forEach(particles => {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Movimento sinusoidal suave
            velocities[i + 1] = Math.sin(Date.now() * 0.001 + i) * 0.0005;
            
            // Resetar posição se a partícula sair do labirinto
            if (Math.abs(positions[i]) > MAZE_SIZE * CELL_SIZE / 2) {
                positions[i] = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
            }
            if (positions[i + 1] < 0 || positions[i + 1] > WALL_HEIGHT) {
                positions[i + 1] = Math.random() * WALL_HEIGHT;
            }
            if (Math.abs(positions[i + 2]) > MAZE_SIZE * CELL_SIZE / 2) {
                positions[i + 2] = (Math.random() - 0.5) * MAZE_SIZE * CELL_SIZE;
            }
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
    });
}

// Função para criar ET
function createAlien(position) {
    const alien = new THREE.Group();
    
    // Cabeça em formato de gota
    const headShape = new THREE.Shape();
    const width = ET_SIZE * 0.8;
    const height = ET_SIZE * 1.4;
    
    headShape.moveTo(0, height);
    headShape.bezierCurveTo(
        width, height,
        width, -height/2,
        0, -height/2
    );
    headShape.bezierCurveTo(
        -width, -height/2,
        -width, height,
        0, height
    );
    
    const headGeometry = new THREE.ExtrudeGeometry(headShape, {
        depth: ET_SIZE * 0.7,
        bevelEnabled: true,
        bevelThickness: ET_SIZE * 0.1,
        bevelSize: ET_SIZE * 0.05,
        bevelSegments: 3
    });
    
    headGeometry.rotateX(Math.PI / 2);
    headGeometry.translate(0, ET_SIZE * 1.2, -ET_SIZE * 0.35);
    
    const headMaterial = new THREE.MeshStandardMaterial({
        color: 0x90EE90,
        metalness: 0.3,
        roughness: 0.6,
        emissive: 0x004400,
        emissiveIntensity: 0.3
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    alien.add(head);
    
    // Olhos amendoados grandes
    const eyeShape = new THREE.Shape();
    const eyeWidth = ET_SIZE * 0.3;
    const eyeHeight = ET_SIZE * 0.15;
    
    eyeShape.ellipse(0, 0, eyeWidth, eyeHeight, 0, Math.PI * 2);
    
    const eyeGeometry = new THREE.ShapeGeometry(eyeShape);
    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.5,
        roughness: 0.4,
        emissive: 0x111111
    });
    
    // Olho esquerdo
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-ET_SIZE * 0.3, ET_SIZE * 1.3, ET_SIZE * 0.4);
    leftEye.rotation.set(-Math.PI * 0.2, Math.PI * 0.15, Math.PI * 0.1);
    alien.add(leftEye);
    
    // Olho direito
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(ET_SIZE * 0.3, ET_SIZE * 1.3, ET_SIZE * 0.4);
    rightEye.rotation.set(-Math.PI * 0.2, -Math.PI * 0.15, -Math.PI * 0.1);
    alien.add(rightEye);
    
    // Pescoço fino
    const neckGeometry = new THREE.CylinderGeometry(ET_SIZE * 0.1, ET_SIZE * 0.15, ET_SIZE * 0.3, 8);
    const neckMaterial = new THREE.MeshStandardMaterial({
        color: 0x90EE90,
        metalness: 0.3,
        roughness: 0.6
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.y = ET_SIZE * 0.6;
    alien.add(neck);
    
    // Corpo fino
    const bodyGeometry = new THREE.CylinderGeometry(ET_SIZE * 0.2, ET_SIZE * 0.15, ET_SIZE * 0.8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x90EE90,
        metalness: 0.3,
        roughness: 0.6,
        emissive: 0x004400,
        emissiveIntensity: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    alien.add(body);
    
    // Braços com dedos longos
    const createArm = (isLeft) => {
        const armGroup = new THREE.Group();
        
        // Braço superior
        const upperArmGeometry = new THREE.CylinderGeometry(ET_SIZE * 0.05, ET_SIZE * 0.04, ET_SIZE * 0.4, 8);
        const arm = new THREE.Mesh(upperArmGeometry, bodyMaterial);
        arm.position.y = ET_SIZE * 0.2;
        armGroup.add(arm);
        
        // Antebraço
        const forearmGeometry = new THREE.CylinderGeometry(ET_SIZE * 0.04, ET_SIZE * 0.03, ET_SIZE * 0.3, 8);
        const forearm = new THREE.Mesh(forearmGeometry, bodyMaterial);
        forearm.position.y = -ET_SIZE * 0.1;
        forearm.rotation.x = Math.PI * 0.15;
        arm.add(forearm);
        
        // Dedos longos
        for(let i = 0; i < 3; i++) {
            const fingerGeometry = new THREE.CylinderGeometry(ET_SIZE * 0.015, ET_SIZE * 0.01, ET_SIZE * 0.25, 4);
            const finger = new THREE.Mesh(fingerGeometry, bodyMaterial);
            finger.position.y = -ET_SIZE * 0.25;
            finger.position.x = (i - 1) * ET_SIZE * 0.04;
            finger.rotation.x = Math.PI * 0.2;
            forearm.add(finger);
        }
        
        armGroup.rotation.z = isLeft ? Math.PI * 0.25 : -Math.PI * 0.25;
        armGroup.position.set(isLeft ? -ET_SIZE * 0.3 : ET_SIZE * 0.3, ET_SIZE * 0.3, 0);
        
        return armGroup;
    };
    
    alien.add(createArm(true)); // Braço esquerdo
    alien.add(createArm(false)); // Braço direito
    
    // Posicionar ET
    alien.position.copy(position);
    alien.position.y = ET_HEIGHT / 2;
    
    // Adicionar propriedades para movimento
    alien.userData.velocity = new THREE.Vector3();
    alien.userData.direction = new THREE.Vector3(1, 0, 0);
    alien.userData.changeDirectionTime = 0;
    alien.userData.health = 100;
    
    scene.add(alien);
    aliens.push(alien);
    return alien;
}

// Função para encontrar posição válida para ET
function findValidPosition() {
    let position = new THREE.Vector3();
    let isValid = false;
    
    while (!isValid) {
        const gridX = Math.floor(Math.random() * MAZE_SIZE);
        const gridZ = Math.floor(Math.random() * MAZE_SIZE);
        
        if (maze[gridZ][gridX] === 0) {
            position.x = gridX * CELL_SIZE - (MAZE_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2;
            position.z = gridZ * CELL_SIZE - (MAZE_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2;
            isValid = true;
        }
    }
    
    return position;
}

// Função para atualizar ETs
function updateAliens() {
    const currentTime = Date.now();
    
    aliens.forEach((alien, index) => {
        if (!alien.userData.health || alien.userData.health <= 0) {
            // Efeito de morte
            createAlienDeathEffect(alien.position);
            scene.remove(alien);
            aliens.splice(index, 1);
            return;
        }

        // Mudar direção a cada 2 segundos
        if (currentTime - alien.userData.changeDirectionTime > 2000) {
            const angle = Math.random() * Math.PI * 2;
            alien.userData.direction.x = Math.cos(angle);
            alien.userData.direction.z = Math.sin(angle);
            alien.userData.changeDirectionTime = currentTime;
            
            // Rotacionar ET para a direção do movimento
            alien.rotation.y = angle;
        }
        
        // Calcular nova posição
        const newX = alien.position.x + alien.userData.direction.x * ET_SPEED;
        const newZ = alien.position.z + alien.userData.direction.z * ET_SPEED;
        
        // Verificar colisão com paredes
        const gridX = Math.floor((newX + (MAZE_SIZE * CELL_SIZE) / 2) / CELL_SIZE);
        const gridZ = Math.floor((newZ + (MAZE_SIZE * CELL_SIZE) / 2) / CELL_SIZE);
        
        if (!checkCollision(newX, newZ)) {
            alien.position.x = newX;
            alien.position.z = newZ;
        } else {
            // Mudar direção se colidir com parede
            alien.userData.direction.x *= -1;
            alien.userData.direction.z *= -1;
            alien.userData.changeDirectionTime = currentTime;
        }
        
        // Efeito flutuante
        alien.position.y = ET_HEIGHT / 2 + Math.sin(currentTime * 0.002) * 0.1;
    });
}

// Efeito de morte do ET
function createAlienDeathEffect(position) {
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = position.x;
        positions[i3 + 1] = position.y;
        positions[i3 + 2] = position.z;
        
        colors[i3] = 0; // R
        colors[i3 + 1] = 1; // G
        colors[i3 + 2] = 0; // B
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.1,
        transparent: true,
        opacity: 1,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Animar partículas
    const velocities = Array(particleCount).fill().map(() => ({
        x: (Math.random() - 0.5) * 0.2,
        y: Math.random() * 0.2,
        z: (Math.random() - 0.5) * 0.2
    }));
    
    function animateParticles() {
        const positions = particles.geometry.attributes.position.array;
        let alive = false;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] += velocities[i].x;
            positions[i3 + 1] += velocities[i].y;
            positions[i3 + 2] += velocities[i].z;
            
            // Aplicar gravidade
            velocities[i].y -= 0.01;
            
            if (positions[i3 + 1] > 0) alive = true;
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        material.opacity *= 0.95;
        
        if (alive && material.opacity > 0.01) {
            requestAnimationFrame(animateParticles);
        } else {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    }
    
    animateParticles();
}

// Efeito de hit no ET
function createHitEffect(position) {
    const hitLight = new THREE.PointLight(0x00ff00, 1, 2);
    hitLight.position.copy(position);
    scene.add(hitLight);
    
    // Remover luz após 100ms
    setTimeout(() => {
        scene.remove(hitLight);
    }, 100);
}

// Loop de animação
function animate() {
    if (gameStarted) {
        gameAnimationId = requestAnimationFrame(animate);
        updatePlayer();
        updateClouds();
        updateParticles();
        updateWeapon();
        updateAliens();
        renderer.render(scene, camera);
    }
}

// Ajustar tamanho da janela
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Iniciar o jogo
init(); 