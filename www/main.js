import { words } from './words.js';

class WordMatchGame {
    constructor() {
        this.currentWords = [];
        this.mistakes = JSON.parse(localStorage.getItem('wordMatchMistakes')) || [];
        this.selectedWord = null;
        this.selectedMeaning = null;
        this.score = 0;
        this.batchSize = 16; // 默认批次大小
        this.currentBatch = 0;
        this.batches = [];
        
        this.initializeElements();
        this.populateUnitSelector();
        this.attachEventListeners();
    }
    
    initializeElements() {
        // 首页元素
        this.homeScreen = document.getElementById('homeScreen');
        this.unitSelector = document.getElementById('unitSelector');
        this.batchSizeInput = document.getElementById('batchSizeInput');
        this.startBtn = document.getElementById('startBtn');
        this.mistakesBtn = document.getElementById('mistakesBtn');
        
        // 游戏界面元素
        this.gameScreen = document.getElementById('gameScreen');
        this.scoreElement = document.getElementById('score');
        this.currentBatchElement = document.getElementById('currentBatch');
        this.totalBatchesElement = document.getElementById('totalBatches');
        this.cardsContainer = document.getElementById('cardsContainer');
        this.backBtn = document.getElementById('backBtn');
        
        // 错误单词界面元素
        this.mistakesScreen = document.getElementById('mistakesScreen');
        this.mistakesContainer = document.getElementById('mistakesContainer');
        this.backFromMistakesBtn = document.getElementById('backFromMistakesBtn');
        this.clearAllMistakesBtn = document.getElementById('clearAllMistakesBtn');
    }
    
    populateUnitSelector() {
        // 添加“全部单词”选项
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '全部单词';
        this.unitSelector.appendChild(allOption);

        // 添加“错词本”选项
        const mistakesOption = document.createElement('option');
        mistakesOption.value = 'error';
        mistakesOption.textContent = '错词本';
        this.unitSelector.appendChild(mistakesOption);

        // 添加实际的单元选项
        Object.keys(words).forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            this.unitSelector.appendChild(option);
        });
    }
    
    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.mistakesBtn.addEventListener('click', () => this.showMistakes());
        this.backBtn.addEventListener('click', () => this.showHomeScreen());
        this.backFromMistakesBtn.addEventListener('click', () => this.showHomeScreen());
        this.clearAllMistakesBtn.addEventListener('click', () => this.clearAllMistakes());
    }
    
    startGame() {
        // 获取批次大小
        this.batchSize = parseInt(this.batchSizeInput.value) || 16;
        this.batchSize = Math.max(4, Math.min(50, this.batchSize)); // 限制在4-50之间
        
        const selectedUnit = this.unitSelector.value;
        
        if (selectedUnit === 'error') {
            // 错误单词库模式
            if (this.mistakes.length === 0) {
                alert('错误单词库为空，请先进行正常游戏以生成错误记录');
                return;
            }
            this.currentWords = this.mistakes.map(mistake => ({
                word: mistake.word,
                meaning: mistake.meaning
            }));
        } else if (selectedUnit === 'all' || selectedUnit === '') {
            // 全部单元模式
            this.currentWords = [];
            Object.values(words).forEach(unitWords => {
                this.currentWords.push(...unitWords);
            });
        } else {
            // 特定单元模式
            this.currentWords = [...words[selectedUnit]];
        }
        
        // 打乱单词顺序
        this.shuffleArray(this.currentWords);
        
        // 将单词分批
        this.createBatches();
        
        // 初始化批次索引
        this.currentBatch = 0;
        
        // 显示游戏界面
        this.homeScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.mistakesScreen.classList.add('hidden');
        
        // 渲染第一批单词
        this.renderCurrentBatch();
    }
    
    createBatches() {
        this.batches = [];
        
        for (let i = 0; i < this.currentWords.length; i += this.batchSize) {
            this.batches.push(this.currentWords.slice(i, i + this.batchSize));
        }
    }
    
    renderCurrentBatch() {
        // 清空容器
        this.cardsContainer.innerHTML = '';
        
        // 重置选择
        this.selectedWord = null;
        this.selectedMeaning = null;
        
        // 获取当前批次的单词
        const currentBatchWords = this.batches[this.currentBatch] || [];
        const wordsList = currentBatchWords.map(item => item.word);
        const meaningsList = currentBatchWords.map(item => item.meaning);
        
        // 打乱词义顺序
        this.shuffleArray(meaningsList);
        
        // 创建混合的卡片数组
        const cards = [];
        
        // 添加单词卡片
        wordsList.forEach((word, index) => {
            cards.push({
                type: 'word',
                content: word,
                index: index
            });
        });
        
        // 添加词义卡片
        meaningsList.forEach((meaning, index) => {
            cards.push({
                type: 'meaning',
                content: meaning,
                index: index
            });
        });
        
        // 打乱卡片顺序
        this.shuffleArray(cards);
        
        // 渲染混合卡片
        cards.forEach(cardData => {
            const card = document.createElement('div');
            card.className = cardData.type + '-card';
            card.textContent = cardData.content;
            card.dataset.type = cardData.type;
            card.dataset.index = cardData.index;
            card.addEventListener('click', () => this.selectCard(card));
            this.cardsContainer.appendChild(card);
        });
        
        // 更新得分和进度
        this.updateScore();
        this.updateProgress();
    }
    
    updateProgress() {
        this.currentBatchElement.textContent = this.currentBatch + 1;
        this.totalBatchesElement.textContent = this.batches.length;
    }
    
    selectCard(card) {
        // 如果卡片已被匹配，则不能选择
        if (card.classList.contains('matched')) return;
        
        const type = card.dataset.type;
        
        if (type === 'word') {
            // 如果已选择单词，则取消选择
            if (this.selectedWord === card) {
                this.selectedWord.classList.remove('selected');
                this.selectedWord = null;
                return;
            }
            
            // 取消之前选择的单词
            if (this.selectedWord) {
                this.selectedWord.classList.remove('selected');
            }
            
            // 选择新单词
            this.selectedWord = card;
            this.selectedWord.classList.add('selected');
        } else if (type === 'meaning') {
            // 如果已选择词义，则取消选择
            if (this.selectedMeaning === card) {
                this.selectedMeaning.classList.remove('selected');
                this.selectedMeaning = null;
                return;
            }
            
            // 取消之前选择的词义
            if (this.selectedMeaning) {
                this.selectedMeaning.classList.remove('selected');
            }
            
            // 选择新词义
            this.selectedMeaning = card;
            this.selectedMeaning.classList.add('selected');
        }
        
        // 如果已选择单词和词义，则进行匹配检查
        if (this.selectedWord && this.selectedMeaning) {
            this.checkMatch();
        }
    }
    
    checkMatch() {
        const wordIndex = parseInt(this.selectedWord.dataset.index);
        const meaningIndex = parseInt(this.selectedMeaning.dataset.index);
        
        const word = this.selectedWord.textContent;
        const meaning = this.selectedMeaning.textContent;
        
        // 查找正确的配对
        const currentBatchWords = this.batches[this.currentBatch] || [];
        const correctPair = currentBatchWords.find(item => item.word === word && item.meaning === meaning);
        
        if (correctPair) {
            // 正确匹配
            this.showMatchEffect(true); // 显示正确匹配特效
            this.selectedWord.classList.add('matched');
            this.selectedMeaning.classList.add('matched');
            this.selectedWord.classList.remove('selected');
            this.selectedMeaning.classList.remove('selected');
            this.score += 10;
            
            // 检查是否完成当前批次
            this.checkBatchCompletion();
        } else {
            // 错误匹配
            this.showMatchEffect(false); // 显示错误匹配特效
            
            // 找到正确的配对并添加到错误列表（查重后添加）
            const correctWordPair = currentBatchWords.find(item => item.word === word);
            const correctMeaningPair = currentBatchWords.find(item => item.meaning === meaning);
            
            if (correctWordPair) {
                this.addMistakeIfNotExists(correctWordPair.word, correctWordPair.meaning);
            }
            
            if (correctMeaningPair && correctMeaningPair !== correctWordPair) {
                this.addMistakeIfNotExists(correctMeaningPair.word, correctMeaningPair.meaning);
            }
            
            // 保存到本地存储
            localStorage.setItem('wordMatchMistakes', JSON.stringify(this.mistakes));
            
            // 立即恢复到未选择前的原始状态（包括颜色），可以再次被选择
            this.selectedWord.classList.remove('selected');
            this.selectedMeaning.classList.remove('selected');
            
            this.score = Math.max(0, this.score - 5);
        }
        
        // 重置选择
        this.selectedWord = null;
        this.selectedMeaning = null;
        
        // 更新得分
        this.updateScore();
    }
    
    // 添加错误单词前进行查重，只有当单词不存在时才添加
    addMistakeIfNotExists(word, meaning) {
        // 检查单词是否已存在于错误列表中
        const exists = this.mistakes.some(mistake => mistake.word === word);
        
        // 只有当单词不存在时才添加
        if (!exists) {
            this.mistakes.push({ word, meaning });
        }
    }
    
    checkBatchCompletion() {
        // 检查当前批次是否全部匹配完成
        const wordCards = this.cardsContainer.querySelectorAll('.word-card:not(.matched)');
        if (wordCards.length === 0) {
            // 当前批次完成，延迟后进入下一批
            setTimeout(() => {
                this.nextBatch();
            }, 1000);
        }
    }
    
    nextBatch() {
        this.currentBatch++;
        
        if (this.currentBatch < this.batches.length) {
            // 还有下一批
            this.renderCurrentBatch();
        } else {
            // 所有批次完成
            const completionMessage = document.createElement('div');
            completionMessage.className = 'completion-message';
            completionMessage.textContent = '恭喜！所有单词已完成！';
            document.body.appendChild(completionMessage);
            
            // 3秒后自动返回首页
            setTimeout(() => {
                if (document.body.contains(completionMessage)) {
                    document.body.removeChild(completionMessage);
                }
                this.showHomeScreen();
            }, 3000);
        }
    }
    
    showHomeScreen() {
        this.homeScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.mistakesScreen.classList.add('hidden');
    }
    
    showMistakes() {
        this.renderMistakes();
        this.homeScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.mistakesScreen.classList.remove('hidden');
    }
    
    renderMistakes() {
        this.mistakesContainer.innerHTML = '';
        
        if (this.mistakes.length === 0) {
            this.mistakesContainer.innerHTML = '<p>暂无错误记录</p>';
            return;
        }
        
        this.mistakes.forEach((mistake, index) => {
            const mistakeItem = document.createElement('div');
            mistakeItem.className = 'mistake-item';
            mistakeItem.innerHTML = `
                <div class="mistake-content">
                    <span class="mistake-word">${mistake.word}</span>
                    <span class="mistake-separator">-</span>
                    <span class="mistake-meaning">${mistake.meaning}</span>
                </div>
                <div class="mistake-actions">
                    <button class="delete-mistake-btn" data-index="${index}">删除</button>
                </div>
            `;
            this.mistakesContainer.appendChild(mistakeItem);
        });
        
        // 绑定删除按钮事件
        document.querySelectorAll('.delete-mistake-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteMistake(index);
            });
        });
    }
    
    deleteMistake(index) {
        this.mistakes.splice(index, 1);
        localStorage.setItem('wordMatchMistakes', JSON.stringify(this.mistakes));
        this.renderMistakes();
    }
    
    clearAllMistakes() {
        if (confirm('确定要清除所有错误记录吗？')) {
            this.mistakes = [];
            localStorage.setItem('wordMatchMistakes', JSON.stringify(this.mistakes));
            this.renderMistakes();
        }
    }
    
    // 显示匹配特效
    showMatchEffect(isCorrect) {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = isCorrect ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.fontSize = '48px';
        overlay.style.fontWeight = 'bold';
        overlay.style.color = 'white';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s';
        overlay.textContent = isCorrect ? '正确!' : '错误!';
        
        document.body.appendChild(overlay);
        
        // 渐显效果
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // 1秒后渐隐并移除
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, 300);
        }, 1000);
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new WordMatchGame();
});