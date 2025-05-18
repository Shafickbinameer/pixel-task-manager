class TaskManager {
  constructor() {
    this.tasks = [];
    this.streak = 0;
    this.taskCounter = 0;
    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = 100;
    this.isPlacing = false;
    this.character = document.getElementById('character');
    this.hammer = document.querySelector('.tool');
    this.taskWall = document.getElementById('taskWall');
    this.taskCounterElement = document.getElementById('taskCounter');
    this.streakCounterElement = document.getElementById('streakCounter');
    this.levelCounterElement = document.getElementById('levelCounter');
    this.xpBar = document.getElementById('xpBar');
    this.xpText = document.getElementById('xpText');
    this.achievementToast = document.getElementById('achievementToast');
    this.activeCategory = 'all';
    
    // Sound elements
    this.buildSound = document.getElementById('buildSound');
    this.completeSound = document.getElementById('completeSound');
    this.streakSound = document.getElementById('streakSound');
    
    this.initEventListeners();
    this.checkForAchievements();
  }

  initEventListeners() {
    document.getElementById('addButton').addEventListener('click', () => this.addTask());
    document.getElementById('clearButton').addEventListener('click', () => this.clearTasks());
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'a' || e.key === 'A') {
        document.getElementById('addButton').click();
      }
    });
    
    // Category filter buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.dataset.category;
        this.filterTasks(this.activeCategory);
      });
    });
  }

  animateHammer() {
    this.hammer.classList.add('hammer-swing');
    setTimeout(() => this.hammer.classList.remove('hammer-swing'), 300);
    document.querySelector('.scene').classList.add('screen-shake');
    setTimeout(() => {
      document.querySelector('.scene').classList.remove('screen-shake');
    }, 500);
  }

  createTaskElement(text, category = 'work') {
    const taskBlock = document.createElement('div');
    taskBlock.className = `task-block ${category}`;
    taskBlock.innerHTML = `
      <div class="task-content">
        <div class="task-category"></div>
        <div class="task-text">${text}</div>
        <div class="task-progress-container">
          <div class="task-progress"></div>
        </div>
        <div class="task-controls">
          <button class="pixel-button complete-btn">SMASH!</button>
        </div>
      </div>
    `;
    return taskBlock;
  }

  addTask() {
    if (this.isPlacing) return;
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) return;

    this.isPlacing = true;
    this.animateHammer();
    this.taskCounter++;
    this.updateCounters();
    
    // Play build sound
    this.playSound(this.buildSound);

    // Determine category (simple implementation - could be enhanced)
    let category = 'work';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('exercise') || lowerText.includes('health')) category = 'health';
    else if (lowerText.includes('learn') || lowerText.includes('study')) category = 'learning';
    else if (lowerText.includes('personal') || lowerText.includes('family')) category = 'personal';

    const taskBlock = this.createTaskElement(text, category);

    // If it's the first task, mark it
    if (this.tasks.length === 0) {
      taskBlock.classList.add('first-task');
    }

    // Remove 'latest-task' from the previous last added task
    if (this.tasks.length > 0) {
      this.tasks[this.tasks.length - 1].classList.remove('latest-task');
    }
    
    taskBlock.classList.add('latest-task');

    document.querySelector('.scene').appendChild(taskBlock);

    // Add random sparkles
    this.addSparkles(taskBlock);

    gsap.to(taskBlock, {
      x: 180 + (this.tasks.length * 180),
      duration: 1.5,
      ease: "power2.out",
      onComplete: () => {
        this.taskWall.appendChild(taskBlock);
        this.setupTaskBehavior(taskBlock);
        input.value = '';
        this.isPlacing = false;
        this.filterTasks(this.activeCategory);
      }
    });

    this.startTaskTimer(taskBlock);
    this.tasks.push(taskBlock);
  }

  addSparkles(element) {
    for (let i = 0; i < 5; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = `${Math.random() * 100}px`;
      sparkle.style.top = `${Math.random() * 100}px`;
      sparkle.style.animationDelay = `${i * 0.1}s`;
      element.appendChild(sparkle);
      
      // Remove after animation
      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.parentNode.removeChild(sparkle);
        }
      }, 1000);
    }
  }

  setupTaskBehavior(taskBlock) {
    const completeBtn = taskBlock.querySelector('.complete-btn');
    completeBtn.addEventListener('click', () => this.completeTask(taskBlock));
    
    // Double click to edit
    taskBlock.addEventListener('dblclick', () => {
      const taskText = taskBlock.querySelector('.task-text');
      const currentText = taskText.textContent;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.className = 'edit-input';
      
      taskText.replaceWith(input);
      input.focus();
      
      input.addEventListener('blur', () => {
        const newText = input.value.trim() || currentText;
        taskText.textContent = newText;
        input.replaceWith(taskText);
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const newText = input.value.trim() || currentText;
          taskText.textContent = newText;
          input.replaceWith(taskText);
        }
      });
    });
  }

  startTaskTimer(taskBlock) {
    const progressBar = taskBlock.querySelector('.task-progress');
    let width = 100;
    
    const timer = setInterval(() => {
      width -= 0.5;
      progressBar.style.width = `${width}%`;
      
      if (width <= 20) {
        taskBlock.classList.add('urgent');
      }
      
      if (width <= 0) {
        clearInterval(timer);
        this.removeTask(taskBlock);
      }
    }, 100);
    
    taskBlock.dataset.timer = timer;
  }

  completeTask(taskBlock) {
    this.animateHammer();
    this.streak++;
    
    // Calculate XP based on streak
    const xpGained = Math.round(this.streak * 10);
    this.addXP(xpGained);
    
    this.updateCounters();

    clearInterval(taskBlock.dataset.timer);

    // Play sound based on streak
    if (this.streak >= 3) {
      this.playSound(this.streakSound);
    } else {
      this.playSound(this.completeSound);
    }

    // Create effects
    this.createCompletionEffect(taskBlock, xpGained);
    this.createParticles(taskBlock);

    // Trigger blast effect
    taskBlock.style.animation = "blast 0.5s ease-out";

    // Remove task after animation
    setTimeout(() => {
      if (taskBlock.parentNode) {
        taskBlock.parentNode.removeChild(taskBlock);
      }
    }, 500);

    // Remove from tasks array
    this.tasks = this.tasks.filter(t => t !== taskBlock);
    
    // Check for achievements
    this.checkForAchievements();
  }

  removeTask(taskBlock) {
    clearInterval(taskBlock.dataset.timer);
    
    // Reset streak if task expires
    this.streak = 0;
    this.updateCounters();
    
    // Fade out animation
    gsap.to(taskBlock, {
      opacity: 0,
      scale: 0.8,
      duration: 0.5,
      onComplete: () => {
        if (taskBlock.parentNode) {
          taskBlock.parentNode.removeChild(taskBlock);
        }
      }
    });

    // Remove from tasks array
    this.tasks = this.tasks.filter(t => t !== taskBlock);
  }

  clearTasks() {
    if (this.tasks.length === 0) return;
    
    if (!confirm('Are you sure you want to clear all tasks?')) return;
    
    this.tasks.forEach(task => {
      clearInterval(task.dataset.timer);
      if (task.parentNode) {
        task.parentNode.removeChild(task);
      }
    });
    
    this.tasks = [];
    this.streak = 0;
    this.updateCounters();
  }

  createCompletionEffect(taskBlock, xpGained) {
    const effect = document.createElement('div');
    effect.className = 'completion-effect';
    effect.textContent = `+${xpGained} XP!`;
    effect.style.left = `${taskBlock.offsetLeft}px`;
    effect.style.top = `${taskBlock.offsetTop}px`;
    document.querySelector('.completion-effects').appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
  }

  createParticles(taskBlock) {
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${taskBlock.offsetLeft + 80}px`;
      particle.style.top = `${taskBlock.offsetTop + 48}px`;
      particle.style.setProperty('--tx', `${-50 + Math.random() * 100}px`);
      particle.style.setProperty('--ty', `${-50 + Math.random() * 100}px`);
      document.querySelector('.scene').appendChild(particle);
      setTimeout(() => particle.remove(), 800);
    }
  }

  addXP(amount) {
    this.xp += amount;
    
    // Check for level up
    if (this.xp >= this.xpToNextLevel) {
      this.levelUp();
    }
    
    this.updateXPBar();
  }

  levelUp() {
    this.level++;
    this.xp -= this.xpToNextLevel;
    this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.2);
    
    // Show level up effect
    const levelUpEffect = document.createElement('div');
    levelUpEffect.className = 'completion-effect';
    levelUpEffect.textContent = `LEVEL UP! ${this.level}⭐`;
    levelUpEffect.style.left = '50%';
    levelUpEffect.style.top = '50%';
    levelUpEffect.style.transform = 'translate(-50%, -50%)';
    levelUpEffect.style.fontSize = '3rem';
    levelUpEffect.style.zIndex = '1000';
    document.querySelector('.scene').appendChild(levelUpEffect);
    
    // Play level up sound
    this.playSound(this.streakSound);
    
    setTimeout(() => {
      if (levelUpEffect.parentNode) {
        levelUpEffect.parentNode.removeChild(levelUpEffect);
      }
    }, 2000);
    
    this.updateCounters();
    this.updateXPBar();
    this.checkForAchievements();
  }

  updateXPBar() {
    const percent = (this.xp / this.xpToNextLevel) * 100;
    this.xpBar.style.setProperty('--xp-percent', `${percent}%`);
    this.xpText.textContent = `${this.xp}/${this.xpToNextLevel} XP`;
  }

  updateCounters() {
    this.taskCounterElement.textContent = this.taskCounter;
    this.streakCounterElement.textContent = this.streak;
    this.levelCounterElement.textContent = this.level;
  }

  filterTasks(category) {
    this.tasks.forEach(task => {
      if (category === 'all' || task.classList.contains(category)) {
        task.style.display = 'block';
      } else {
        task.style.display = 'none';
      }
    });
  }

  playSound(soundElement) {
    if (soundElement) {
      soundElement.currentTime = 0;
      soundElement.play().catch(e => console.log("Audio play failed:", e));
    }
  }

  checkForAchievements() {
    const achievements = [
      {
        id: 'first_task',
        condition: () => this.taskCounter === 1,
        title: 'First Blueprint!',
        description: 'You created your first construction blueprint'
      },
      {
        id: 'streak_3',
        condition: () => this.streak >= 3,
        title: 'Hot Streak!',
        description: 'Completed 3 tasks in a row'
      },
      {
        id: 'streak_5',
        condition: () => this.streak >= 5,
        title: 'On Fire!',
        description: 'Completed 5 tasks in a row'
      },
      {
        id: 'level_5',
        condition: () => this.level >= 5,
        title: 'Master Builder',
        description: 'Reached level 5'
      },
      {
        id: 'task_10',
        condition: () => this.taskCounter >= 10,
        title: 'Construction Pro',
        description: 'Created 10 tasks'
      }
    ];

    achievements.forEach(achievement => {
      if (achievement.condition() && !localStorage.getItem(achievement.id)) {
        this.showAchievement(achievement.title, achievement.description);
        localStorage.setItem(achievement.id, 'true');
      }
    });
  }

  showAchievement(title, description) {
    this.achievementToast.innerHTML = `
      <h3>🏆 ${title}</h3>
      <p>${description}</p>
    `;
    this.achievementToast.classList.add('show');
    
    setTimeout(() => {
      this.achievementToast.classList.remove('show');
    }, 5000);
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  const taskManager = new TaskManager();
  
  // Add sample tasks if localStorage is empty (for demo purposes)
  if (localStorage.getItem('first_visit') === null) {
    setTimeout(() => {
      const sampleTasks = [
        'Build a pixel castle',
        'Learn new CSS tricks',
        'Exercise for 30 minutes',
        'Call family members'
      ];
      
      sampleTasks.forEach((task, i) => {
        setTimeout(() => {
          document.getElementById('taskInput').value = task;
          taskManager.addTask();
        }, i * 1000);
      });
      
      localStorage.setItem('first_visit', 'true');
    }, 1000);
  }
});