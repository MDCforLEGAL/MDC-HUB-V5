import type { GameGlyphName } from "../components/GameGlyph";

export type ScriptStatus = "working" | "patched";
export type ScriptSource = "mdc" | "scriptblox" | "rscripts";

export interface ScriptEntry {
  id: string;
  game: string;
  category: string;
  title: string;
  author: string;
  verified: boolean;
  status: ScriptStatus;
  premium?: boolean;
  tags: string[];
  rating: number;
  downloads: string;
  updated: string;
  glyph: GameGlyphName;
  colors: [string, string];
  summary: string;
  code: string;
  source?: ScriptSource;
  sourceLabel?: string;
  sourceUrl?: string;
  gameImage?: string;
  likes?: number;
  views?: number;
  keyless?: boolean;
  universal?: boolean;
  categoryIds?: string[];
  slug?: string;
}

export interface LibraryCategory {
  id: string;
  label: string;
  description?: string;
  count: number;
}

export interface LibrarySource {
  id: string;
  label: string;
  url: string;
  count?: number;
}

export interface LiveScript {
  id: string;
  slug: string;
  source: ScriptSource;
  sourceLabel: string;
  sourceUrl: string;
  title: string;
  game: string;
  gameImage?: string;
  author: string;
  authorVerified?: boolean;
  verified: boolean;
  status: ScriptStatus;
  premium: boolean;
  keyless: boolean;
  universal: boolean;
  tags: string[];
  views: number;
  likes: number;
  rating?: number;
  summary: string;
  code: string;
  createdAt?: string;
  updatedAt: string;
  categoryIds: string[];
  glyph: GameGlyphName;
  colors: [string, string];
}

export interface LibraryData {
  generatedAt: string | null;
  sources: LibrarySource[];
  categories: LibraryCategory[];
  scripts: LiveScript[];
}

export const scripts: ScriptEntry[] = [
  {
    id: "blox-fruits-auto-farm",
    game: "Blox Fruits",
    category: "Adventure",
    title: "Auto Farm V4 · Karma Mode",
    author: "kaizen",
    verified: true,
    status: "working",
    tags: ["Auto Farm", "Mobile", "Keyless"],
    rating: 4.9,
    downloads: "128K",
    updated: "3 dk önce",
    glyph: "fruit",
    colors: ["#00F0FF", "#0066FF"],
    summary:
      "Mobları anında hedefleyen, quest döngüsünü otomatik yöneten ve düşük gecikmeyle çalışan seviye atlama modülü.",
    code: `-- MDC HUB // blox-fruits / auto-farm v4.2
-- secure loader · discord.gg/mdchub

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer

local CONFIG = {
    autoFarm   = true,
    autoQuest  = true,
    hopOnDeath = true,
    walkSpeed  = 120,
}

local function nearestEnemy()
    local best, dist = nil, math.huge
    for _, mob in ipairs(workspace.Enemies:GetChildren()) do
        local root = mob:FindFirstChild("HumanoidRootPart")
        local humanoid = mob:FindFirstChildOfClass("Humanoid")
        if root and humanoid and humanoid.Health > 0 then
            local d = (root.Position - player.Character.HumanoidRootPart.Position).Magnitude
            if d < dist then best, dist = mob, d end
        end
    end
    return best
end

RunService.Heartbeat:Connect(function()
    if not CONFIG.autoFarm or not player.Character then return end
    local target = nearestEnemy()
    if target then
        player.Character.HumanoidRootPart.CFrame =
            target.HumanoidRootPart.CFrame * CFrame.new(0, 6, 0)
    end
end)

print(("[MDC] Blox Fruits aktif · %d studs/s"):format(CONFIG.walkSpeed))`,
  },
  {
    id: "pet-sim-99-auto-hatch",
    game: "Pet Simulator 99",
    category: "Simulator",
    title: "Auto Hatch & Coin Magnet",
    author: "nyx.build",
    verified: true,
    status: "working",
    tags: ["Auto Hatch", "Keyless", "Idle"],
    rating: 4.8,
    downloads: "94K",
    updated: "27 dk önce",
    glyph: "paw",
    colors: ["#00F0FF", "#00B894"],
    summary:
      "Yumurta döngüsünü sunucu tarafında güvenli aralıklarla çalıştırır; coin ve elmas toplamayı otomatikleştirir.",
    code: `-- MDC HUB // pet-simulator-99 / auto-hatch
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local player = game:GetService("Players").LocalPlayer

local CONFIG = {
    autoHatch = true,
    autoCoins = true,
    eggs = { "Cracked Egg", "Golden Egg", "Crystal Egg" },
}

local function requestHatch()
    local remote = ReplicatedStorage:FindFirstChild("HatchEgg")
    if not remote then return warn("[MDC] Sunucu senkronizasyonu bekleniyor") end
    for _, egg in ipairs(CONFIG.eggs) do
        remote:FireServer(egg, 3)
        task.wait(0.2)
    end
end

task.spawn(function()
    while CONFIG.autoHatch do
        if player.Character then requestHatch() end
        task.wait(1.5)
    end
end)

print("[MDC] Pet Simulator 99 · auto hatch hazır")`,
  },
  {
    id: "arsenal-silent-aim",
    game: "Arsenal",
    category: "FPS",
    title: "Silent Aim & ESP Overlay",
    author: "v0id.run",
    verified: false,
    status: "patched",
    premium: true,
    tags: ["Aimbot", "ESP", "Premium"],
    rating: 4.2,
    downloads: "210K",
    updated: "2 gün önce",
    glyph: "crosshair",
    colors: ["#B33A3A", "#4A0000"],
    summary:
      "Byfron anti-cheat güncellemesi sonrası devre dışı. Geliştirici yeniden yazım üzerinde çalışıyor; bekleme listesine katılabilirsin.",
    code: `-- MDC HUB // arsenal / silent-aim
-- STATUS: PATCHED · 2026-10-22
-- Byfron güncellemesi sonrası yeniden yazılıyor.

local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")
local camera = Workspace.CurrentCamera
local player = Players.LocalPlayer

local SETTINGS = {
    fov = 120,
    smoothness = 0.18,
    teamCheck = true,
}

local function closestTarget()
    local target, best = nil, SETTINGS.fov
    for _, other in ipairs(Players:GetPlayers()) do
        if other ~= player and other.Character then
            local head = other.Character:FindFirstChild("Head")
            if head then
                local screen, visible = camera:WorldToViewportPoint(head.Position)
                local offset = Vector2.new(screen.X, screen.Y) - camera.ViewportSize / 2
                if visible and offset.Magnitude < best then
                    target, best = head, offset.Magnitude
                end
            end
        end
    end
    return target
end

camera:GetPropertyChangedSignal("CFrame"):Connect(function()
    local head = closestTarget()
    if head then
        camera.CFrame = CFrame.lookAt(camera.CFrame.Position, head.Position)
    end
end)`,
  },
  {
    id: "doors-auto-skip",
    game: "Doors",
    category: "Horror",
    title: "Auto Skip & Entity Radar",
    author: "luxe.dev",
    verified: true,
    status: "working",
    tags: ["Auto Skip", "ESP", "Keyless"],
    rating: 4.7,
    downloads: "61K",
    updated: "1 saat önce",
    glyph: "door",
    colors: ["#00F0FF", "#00A3FF"],
    summary:
      "Kapı geçişlerini otomatik tamamlar, görüş alanındaki entity'leri işaretler ve takım arkadaşlarını rahatsız etmez.",
    code: `-- MDC HUB // doors / auto-skip + entity radar
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

local CONFIG = { autoSkip = true, entityRadar = true, maxDistance = 400 }

local function scanEntities()
    local list = {}
    for _, model in ipairs(Workspace:GetChildren()) do
        if model:FindFirstChild("Humanoid") and model.Name:match("Entity") then
            table.insert(list, model)
        end
    end
    return list
end

if CONFIG.entityRadar then
    RunService.RenderStepped:Connect(function()
        for _, entity in ipairs(scanEntities()) do
            local root = entity:FindFirstChild("HumanoidRootPart")
            if root then
                local screen = Workspace.CurrentCamera:WorldToViewportPoint(root.Position)
                if screen.Z > 0 then drawMarker(entity.Name, screen) end
            end
        end
    end)
end

print(("[MDC] Doors · %d entity izleniyor"):format(#scanEntities()))`,
  },
  {
    id: "jailbreak-auto-rob",
    game: "Jailbreak",
    category: "Roleplay",
    title: "Auto Rob & Speed Glitch",
    author: "saint.lua",
    verified: false,
    status: "patched",
    tags: ["Auto Rob", "Speed", "Risky"],
    rating: 3.9,
    downloads: "88K",
    updated: "5 gün önce",
    glyph: "car",
    colors: ["#0066FF", "#0044AA"],
    summary:
      "v9 anti-cheat sonrası çalışmıyor. Hız ve teleport davranışları sunucu tarafından loglanıyor — hesap riski yüksek.",
    code: `-- MDC HUB // jailbreak / auto-rob
-- STATUS: PATCHED · anti-cheat v9
local player = game:GetService("Players").LocalPlayer
local replicated = game:GetService("ReplicatedStorage")

local CONFIG = { autoRob = true, autoArrest = false, speed = 34 }
local JEWELRY = Vector3.new(132, 12, 348)

local function teleportTo(position)
    if not player.Character then return end
    player.Character:PivotTo(CFrame.new(position))
end

task.spawn(function()
    while CONFIG.autoRob do
        if player.Character and player.Team.Name ~= "Police" then
            teleportTo(JEWELRY)
            local remote = replicated:FindFirstChild("RobJewelry")
            if remote then remote:FireServer() end
        end
        task.wait(2)
    end
end)

print("[MDC] Jailbreak · otomatik soygun denemesi")`,
  },
  {
    id: "tower-defense-infinite",
    game: "Tower Defense",
    category: "Strategy",
    title: "Infinite Gems & Auto Place",
    author: "orbit",
    verified: true,
    status: "working",
    tags: ["Auto Place", "Infinite", "Keyless"],
    rating: 4.6,
    downloads: "43K",
    updated: "12 dk önce",
    glyph: "tower",
    colors: ["#7C5CFF", "#0066FF"],
    summary:
      "Boş yerleşim alanlarını tarar, en verimli kule kombinasyonunu kurar ve otomatik yükseltme döngüsünü yönetir.",
    code: `-- MDC HUB // tower-defense / infinite-gems
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local CONFIG = { autoPlace = true, autoUpgrade = true, reserve = 1_000_000 }

local function placeTower(towerName, cframe)
    local remote = ReplicatedStorage:FindFirstChild("PlaceTower")
    if remote then remote:FireServer(towerName, cframe) end
end

for _, unit in ipairs(workspace.Units:GetChildren()) do
    local slot = unit:FindFirstChild("Placement")
    if slot and CONFIG.autoPlace then
        placeTower("Golden Ranger", slot.CFrame)
        task.wait(0.4)
    end
end

RunService.Heartbeat:Connect(function()
    for _, tower in ipairs(workspace.Towers:GetChildren()) do
        if CONFIG.autoUpgrade and tower:FindFirstChild("Upgrade") then
            tower.Upgrade:FireServer()
        end
    end
end)

print("[MDC] Tower Defense · otomatik yerleşim aktif")`,
  },
  {
    id: "royale-high-diamond",
    game: "Royale High",
    category: "Roleplay",
    title: "Diamond Farm & Auto Win",
    author: "seraph",
    verified: true,
    status: "working",
    tags: ["Auto Farm", "Diamonds", "Keyless"],
    rating: 4.5,
    downloads: "37K",
    updated: "4 saat önce",
    glyph: "crown",
    colors: ["#00F0FF", "#7C5CFF"],
    summary:
      "Divinia Park rotasında elmas toplama noktalarını dolaşan, düşük profil bırakan sabırlı farm modülü.",
    code: `-- MDC HUB // royale-high / diamond-farm
local player = game:GetService("Players").LocalPlayer
local rep = game:GetService("ReplicatedStorage")

local CONFIG = { autoFarm = true, autoWin = true, realm = "Divinia Park" }

local function joinRealm(name)
    local service = rep:FindFirstChild("RealmService")
    if service then service.Join:FireServer(name) end
end

if CONFIG.realm then joinRealm(CONFIG.realm) end

task.spawn(function()
    while CONFIG.autoFarm do
        for _, checkpoint in ipairs(workspace.Checkpoints:GetChildren()) do
            if player.Character then
                player.Character:PivotTo(checkpoint.CFrame)
                rep.DiamondService.Collect:FireServer(checkpoint.Name)
            end
            task.wait(0.6)
        end
    end
end)

print("[MDC] Royale High · diamond farm başlatıldı")`,
  },
  {
    id: "da-hood-aim-lock",
    game: "Da Hood",
    category: "PvP",
    title: "Aim Lock & Auto Block",
    author: "raze",
    verified: false,
    status: "patched",
    premium: true,
    tags: ["Aimbot", "Auto Block", "Premium"],
    rating: 4.1,
    downloads: "152K",
    updated: "1 gün önce",
    glyph: "dice",
    colors: ["#8B0000", "#4A0000"],
    summary:
      "Sunucu tarafı doğrulama değişikliği nedeniyle kilitlendi. Premium sahipleri için otomatik güncelleme sırada.",
    code: `-- MDC HUB // da-hood / aim-lock + auto-block
-- STATUS: PATCHED · 2026-10-20
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local CONFIG = { fov = 90, autoBlock = true }

local function enemyInFov()
    for _, other in ipairs(Players:GetPlayers()) do
        if other ~= player and other.Character then
            local head = other.Character:FindFirstChild("Head")
            if head then
                local screen = camera:WorldToViewportPoint(head.Position)
                local center = Vector2.new(screen.X, screen.Y) - camera.ViewportSize / 2
                if center.Magnitude < CONFIG.fov then return head end
            end
        end
    end
end

task.spawn(function()
    while task.wait(0.1) do
        local head = enemyInFov()
        if head then
            camera.CFrame = CFrame.lookAt(camera.CFrame.Position, head.Position)
            if CONFIG.autoBlock then
                player.Character.Combat.Block:FireServer(true)
            end
        end
    end
end)`,
  },
  {
    id: "blue-lock-auto-goal",
    game: "Blue Lock Rivals",
    category: "Sports",
    title: "Auto Goal & Flow Farm",
    author: "kairo",
    verified: true,
    status: "working",
    tags: ["Auto Goal", "Flow", "Keyless"],
    rating: 4.8,
    downloads: "72K",
    updated: "8 dk önce",
    glyph: "ball",
    colors: ["#00F0FF", "#0066FF"],
    summary:
      "Maç döngüsünde gol pozisyonlarını otomatik değerlendirir ve Flow puanı kazanımını hızlandırır.",
    code: `-- MDC HUB // blue-lock-rivals / auto-goal
local player = game:GetService("Players").LocalPlayer
local rep = game:GetService("ReplicatedStorage")

local CONFIG = { autoGoal = true, flowFarm = true, speed = 42 }
local goal = workspace:FindFirstChild("EnemyGoal")

local function score()
    local ball = workspace:FindFirstChild("Ball")
    if not player.Character or not goal or not ball then return end
    ball:PivotTo(goal.CFrame)
    local remote = rep:FindFirstChild("GoalRemote")
    if remote then remote:FireServer() end
end

task.spawn(function()
    while CONFIG.autoGoal do
        score()
        if CONFIG.flowFarm then
            rep.FlowReward:FireServer("match")
        end
        task.wait(1.2)
    end
end)

print("[MDC] Blue Lock Rivals · otomatik gol aktif")`,
  },
];

export const games = ["Tümü", ...Array.from(new Set(scripts.map((script) => script.game)))];

export const trendingSearches = [
  "Blox Fruits",
  "Pet Simulator 99",
  "Auto Farm",
  "Aimbot",
  "Doors ESP",
];

export const fallbackCategories: LibraryCategory[] = [
  {
    id: "curated",
    label: "Küratör Seçkisi",
    description: "MDC tarafından hazırlanan örnek seçki",
    count: scripts.length,
  },
];
