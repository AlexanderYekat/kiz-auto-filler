// ==UserScript==
// @name         УПД: Убираем хвост для сканирования марок
// @version      2025.04.02.03
// @description  Оптимизированная версия
// ==/UserScript==

console.log('Расширение УПД активировано - версия 2025.04.02.04');
let observer = null;
let processedIds = new Set(); // Кэш для отслеживания уже обработанных элементов
let isProcessing = false; // Флаг для предотвращения параллельной обработки
let mutationDebounceTimer = null; // Для дебаунсинга обработки мутаций
let isTyping = false; // Флаг для блокировки обработки во время ввода текста
let typingTimer = null; // Таймер для отслеживания окончания ввода

// Включите true для подробного логирования
const DEBUG = false;

// Оптимизированное логирование
function log(message, ...args) {
  if (DEBUG) {
    console.log(message, ...args);
  }
}

function stopObserving() {
  if (observer) {
    console.log('Отменяем наблюдение за DOM');
    observer.disconnect();
    observer = null;
  }
}

function changeElementContent() {
  // Предотвращаем параллельный запуск
  if (isProcessing || isTyping) {
    log('Пропускаем обработку: ' + (isProcessing ? 'идет обработка' : 'пользователь вводит текст'));
    return;
  }
  
  isProcessing = true;
  log('Начинаем поиск целевых элементов');
  
  // ВАЖНО: используем тот же селектор, который работал раньше
  const targetElements = document.querySelectorAll('input[name^="product.extra_inf.good_identification_numbers"][name$="].id"]');
  
  if (targetElements.length === 0) {
    log('Целевые элементы не найдены');
    stopObserving();
    setTimeout(checkForElements, 3000);
    isProcessing = false;
    return;
  }
  
  log('Найдено элементов:', targetElements.length);
  console.log(`Найдено ${targetElements.length} целевых элементов`);
  
  // Для небольшого количества элементов обрабатываем все сразу
  if (targetElements.length < 30) {
    let processed = 0;
    for (let i = 0; i < targetElements.length; i++) {
      if (processElement(targetElements[i], i)) {
        processed++;
      }
    }
    
    if (processed > 0) {
      console.log(`Обработано ${processed} элементов`);
    } else {
      log('Ни один элемент не требует обработки');
    }
    
    isProcessing = false;
  } else {
    // Для большого количества - используем более эффективный батчинг
    processBatches(targetElements, 15);
  }
}

// Вынесли батчинг в отдельную функцию для чистоты кода
function processBatches(elements, batchSize) {
  let index = 0;
  let totalProcessed = 0;
  
  function processBatch() {
    // Проверяем флаг ввода текста перед каждым пакетом
    if (isTyping) {
      // Отложить обработку, если идет ввод текста
      setTimeout(() => {
        if (!isTyping) {
          processBatch();
        }
      }, 300);
      return;
    }
    
    const endIndex = Math.min(index + batchSize, elements.length);
    log(`Обработка пакета элементов ${index} - ${endIndex-1}`);
    
    let batchProcessed = 0;
    for (let i = index; i < endIndex; i++) {
      if (processElement(elements[i], i)) {
        batchProcessed++;
        totalProcessed++;
      }
    }
    
    if (batchProcessed > 0) {
      console.log(`В этом пакете обработано: ${batchProcessed}`);
    }
    
    index = endIndex;
    
    if (index < elements.length) {
      // Добавляем небольшую прогрессивную задержку для снижения нагрузки на большом количестве элементов
      const delay = Math.min(50 + Math.floor(elements.length / 20), 100);
      setTimeout(processBatch, delay);
    } else {
      if (totalProcessed > 0) {
        console.log(`Обработка всех элементов завершена. Всего изменено: ${totalProcessed}`);
      } else {
        log('Все элементы уже были обработаны');
      }
      isProcessing = false;
    }
  }
  
  processBatch();
}

// Функция для изменения содержимого элемента
function processElement(targetElement, index) {
  // Проверяем, был ли этот элемент уже обработан
  const elementId = targetElement.id || targetElement.name;
  if (!elementId) {
    log(`Элемент ${index + 1} не имеет ID, пропускаем`);
    return false;
  }
  
  if (processedIds.has(elementId)) {
    log(`Элемент ${index + 1} (${elementId}) уже обработан, пропускаем`);
    return false;
  }
  
  const currentValue = targetElement.value;
  
  // Проверка на пустое значение
  if (!currentValue || currentValue.trim() === '') {
    log(`Значение элемента ${index + 1} пустое. Изменение не требуется.`);
    return false;
  }
  
  // Проверка длины
  if (currentValue.length < 83) {
    log(`Изменения уже были внесены в элемент ${index + 1}, длина: ${currentValue.length}`);
    processedIds.add(elementId); // Помечаем как обработанный
    return false;
  }
  
  log(`Изменяем текст элемента ${index + 1}:`, currentValue);
  const newValue = currentValue.slice(0, 31);
  log("на текст:", newValue);
  
  targetElement.value = newValue;
  
  // Вызываем событие изменения для обновления React-состояния
  const event = new Event('input', { bubbles: true });
  targetElement.dispatchEvent(event);
  
  // Добавляем в кэш обработанных элементов
  processedIds.add(elementId);
  log('Содержимое элемента изменено на:', newValue);
  return true;
}

// Отслеживание событий ввода на странице
function setupInputTracking() {
  // Блокируем обработку при начале ввода
  document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      isTyping = true;
      log('Пользователь начал вводить текст, приостанавливаем обработку');
    }
  }, true);
  
  // Функция, которая вызывается после окончания ввода текста
  function onTypingEnded() {
    isTyping = false;
    log('Ввод текста завершен, разрешаем обработку');
  }
  
  // Отслеживаем нажатия клавиш
  document.addEventListener('keydown', () => {
    if (isTyping) {
      // Сбрасываем таймер при каждом нажатии клавиши
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      // Устанавливаем новый таймер
      typingTimer = setTimeout(onTypingEnded, 1000);
    }
  }, true);
  
  // Сбрасываем флаг при потере фокуса
  document.addEventListener('focusout', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      // Небольшая задержка для завершения потенциальных изменений DOM
      setTimeout(onTypingEnded, 300);
    }
  }, true);
}

// Функция для наблюдения за изменениями в DOM с дебаунсингом
function observeChanges() {
  console.log('Начинаем наблюдение за изменениями в DOM');
  
  if (observer) {
    observer.disconnect();
  }
  
  // Дебаунсинг для предотвращения частых вызовов при множественных изменениях DOM
  function debouncedProcessChanges() {
    if (mutationDebounceTimer) {
      clearTimeout(mutationDebounceTimer);
    }
    
    mutationDebounceTimer = setTimeout(() => {
      if (!isProcessing && !isTyping) {
        log('Вызываем changeElementContent после изменения DOM (debounced)');
        changeElementContent();
      } else {
        log('Пропускаем обработку DOM-изменений, так как система занята или идет ввод текста');
      }
      mutationDebounceTimer = null;
    }, 500);  // Увеличиваем задержку до 500мс для уменьшения влияния
  }
  
  observer = new MutationObserver((mutations) => {
    // Не обрабатываем изменения, если пользователь вводит текст
    if (isTyping) {
      return;
    }
    
    // Проверяем, есть ли релевантные изменения
    const hasRelevantChanges = mutations.some(mutation => {
      // Игнорируем изменения в атрибутах
      if (mutation.type === 'attributes') return false;
      
      // Игнорируем изменения в текстовых узлах
      if (mutation.type === 'characterData') return false;
      
      // Проверяем только добавление/удаление узлов
      if (mutation.type !== 'childList') return false;
      
      // Игнорируем изменения в полях ввода
      if (mutation.target.tagName === 'INPUT' || mutation.target.tagName === 'TEXTAREA') {
        return false;
      }
      
      // Игнорируем изменения в contenteditable элементах
      if (mutation.target.getAttribute && mutation.target.getAttribute('contenteditable') === 'true') {
        return false;
      }
      
      // Проверяем добавленные узлы на наличие input элементов с нужным паттерном
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType !== 1) return false; // не элемент
        
        // Прямая проверка на input
        if (node.tagName === 'INPUT') {
          const name = node.getAttribute('name');
          return name && name.startsWith('product.extra_inf.good_identification_numbers') && name.endsWith('].id');
        }
        
        // Проверка на наличие вложенных input элементов с нужным паттерном
        if (node.querySelector) {
          return node.querySelector('input[name^="product.extra_inf.good_identification_numbers"][name$="].id"]') !== null;
        }
        
        return false;
      });
    });
    
    if (hasRelevantChanges) {
      log('Обнаружены релевантные изменения в DOM');
      debouncedProcessChanges();
    }
  });

  // Наблюдаем только за определенными частями DOM
  const form = document.querySelector('form');
  const main = document.querySelector('main');
  const target = form || main || document.body;
  
  observer.observe(target, { 
    childList: true, 
    subtree: true,
    attributes: false, // Не следим за изменениями атрибутов для ускорения
    characterData: false // Не следим за изменениями текста для ускорения
  });
  
  console.log('Наблюдатель DOM установлен на', target.tagName);
}

// Функция для периодической проверки наличия элемента
function checkForElements() {
  log('Проверяем наличие элементов');
  const elements = document.querySelectorAll('input[name^="product.extra_inf.good_identification_numbers"][name$="].id"]');
  
  if (elements.length > 0) {
    console.log(`Найдено ${elements.length} элементов, обрабатываем`);
    changeElementContent();
    observeChanges();
  } else {
    log('Элементы не найдены, повторная проверка через 3 секунды');
    setTimeout(checkForElements, 3000);
  }
}

// Инициализация
function init() {
  // Настраиваем отслеживание ввода текста
  setupInputTracking();
  
  // Запускаем основной процесс
  console.log('Запускаем проверку наличия элементов');
  checkForElements();
  
  // Очистка при уходе со страницы
  window.addEventListener('beforeunload', () => {
    stopObserving();
  });
}

// Запуск расширения
init();