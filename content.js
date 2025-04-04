// ==UserScript==
// @name         УПД: Тест нажатия кнопки
// @version      2025.04.03.19
// @description  Тест функции нажатия кнопки
// ==/UserScript==

console.log('Расширение УПД 2025.04.03.19 (тест кнопки) активировано');

// Поиск кнопки "Добавить КИЗ"
function findAddButton() {
  console.log('Ищем кнопку "Добавить КИЗ"...');
  
  // Ищем кнопку напрямую по тексту
  const buttons = document.querySelectorAll('button');
  console.log(`Найдено ${buttons.length} кнопок на странице`);
  
  for (const button of buttons) {
    if (button.textContent.trim() === 'Добавить КИЗ') {
      console.log('Найдена кнопка "Добавить КИЗ":', button);
      return button;
    }
  }
  
  // Запасной вариант: ищем по структуре и классам
  const grids = document.querySelectorAll('div.MuiGrid-root');
  console.log(`Найдено ${grids.length} div с классом MuiGrid-root`);
  
  for (const grid of grids) {
    const button = grid.querySelector('button.MuiButtonBase-root.MuiButton-root.css-mgv5rm');
    if (button && button.textContent.trim() === 'Добавить КИЗ') {
      console.log('Найдена кнопка "Добавить КИЗ" через структуру:', button);
      return button;
    }
  }
  
  console.log('Кнопка "Добавить КИЗ" не найдена');
  return null;
}

// Поиск и заполнение поля для КИЗ
function findAndFillKizField(kizValue) {
  console.log('Ищем поле для ввода КИЗ...');
  
  // Ищем поле ввода по имени (атрибут name) с правильным pattern
  const kizInput = document.querySelector('input[name="product.extra_inf.good_identification_numbers[0].cis[0]"]');
  
  if (kizInput) {
    console.log('Найдено поле для ввода КИЗ:', kizInput);
    
    // Устанавливаем значение
    kizInput.value = kizValue;
    
    // Создаем событие ввода для активации валидации и других обработчиков
    //const inputEvent = new Event('input', { bubbles: true });
    //kizInput.dispatchEvent(inputEvent);
    
    // Создаем событие изменения для активации валидации и других обработчиков
    //const changeEvent = new Event('change', { bubbles: true });
    //kizInput.dispatchEvent(changeEvent);
    
    console.log('Поле КИЗ успешно заполнено значением:', kizValue);
    return true;
  } else {
    console.log('Поле для ввода КИЗ не найдено');    
    return false;
  }
}

// Поиск последнего индекса полей КИЗ
function findLastKizFieldIndex() {
  console.log('Ищем все поля для ввода КИЗ и определяем последний индекс...');
  
  // Используем CSS-селектор для поиска всех полей ввода с правильным pattern
  const kizInputs = document.querySelectorAll('input[name^="product.extra_inf.good_identification_numbers[0].cis["]');
  console.log(`Найдено ${kizInputs.length} полей ввода КИЗ`);
  
  if (kizInputs.length === 0) {
    console.log('Поля для ввода КИЗ не найдены');
    return -1;
  }
  
  // Находим максимальный индекс среди полей
  let maxIndex = -1;
  for (const input of kizInputs) {
    const name = input.getAttribute('name');
    // Извлекаем индекс из названия поля (последнее число в квадратных скобках)
    const match = name.match(/cis\[(\d+)\]/);
    if (match && match[1]) {
      const index = parseInt(match[1], 10);
      if (index > maxIndex) {
        maxIndex = index;
      }
    }
  }
  
  console.log(`Максимальный индекс среди полей КИЗ: ${maxIndex}`);
  return maxIndex;
}

// Создание и заполнение нескольких полей КИЗ
function createAndFillKizFields(kizValues) {
  console.log(`Начинаем создание и заполнение ${kizValues.length} полей КИЗ`);
  
  // Получаем текущий индекс полей КИЗ
  const startIndex = findLastKizFieldIndex();
  console.log(`Текущий последний индекс полей КИЗ: ${startIndex}`);
  
  // Находим кнопку "Добавить КИЗ"
  const addButton = findAddButton();
  if (!addButton) {
    console.error('Не удалось найти кнопку "Добавить КИЗ"');
    return Promise.resolve({ 
      success: false,
      message: 'Не удалось найти кнопку "Добавить КИЗ"'
    });
  }
  
  // Определяем, сколько раз нужно нажать кнопку
  // Если startIndex == -1, значит полей еще нет, нужно создать kizValues.length полей
  // Если startIndex >= 0, значит уже есть startIndex+1 полей, нужно создать kizValues.length-(startIndex+1) полей
  const fieldsToCreate = startIndex === -1 ? kizValues.length : Math.max(0, kizValues.length - (startIndex + 1));
  console.log(`Необходимо создать ${fieldsToCreate} новых полей КИЗ`);
  
  // Отправляем сообщение о начале создания полей
  chrome.runtime.sendMessage({
    type: "PROGRESS_UPDATE",
    message: `Найдено ${startIndex + 1 > 0 ? startIndex + 1 : 0} существующих полей. Создаю ${fieldsToCreate} новых полей КИЗ...`
  });
  
  // Для больших объемов используем пакетную обработку
  const BATCH_SIZE = 20; // Создаем поля пакетами по 20 штук
  const batches = Math.ceil(fieldsToCreate / BATCH_SIZE);
  
  let processedFields = 0;
  let clickPromise = Promise.resolve();
  
  // Обработка по пакетам
  for (let batch = 0; batch < batches; batch++) {
    clickPromise = clickPromise.then(() => {
      return new Promise(resolve => {
        // Определяем размер текущего пакета
        const currentBatchSize = Math.min(BATCH_SIZE, fieldsToCreate - processedFields);
        
        // Информируем о начале обработки пакета
        chrome.runtime.sendMessage({
          type: "PROGRESS_UPDATE",
          message: `Обработка пакета ${batch + 1} из ${batches} (поля ${processedFields + 1}-${processedFields + currentBatchSize})...`
        });
        
        // Создаем поля текущего пакета
        createFieldsBatch(addButton, currentBatchSize, processedFields, fieldsToCreate).then(() => {
          processedFields += currentBatchSize;
          
          // Даем DOM время на обновление между пакетами (увеличенная пауза)
          setTimeout(resolve, 1000); // 1 секунда между пакетами
        });
      });
    });
  }
  
  // После всех нажатий кнопки даем время на отрисовку полей и заполняем их
  return clickPromise.then(() => {
    // Возвращаем Promise, который разрешится после заполнения полей
    return new Promise(resolve => {
      // Отправляем сообщение о начале заполнения полей
      chrome.runtime.sendMessage({
        type: "PROGRESS_UPDATE",
        message: `Поля созданы. Начинаем заполнение данными...`
      });
      
      // Даем дополнительное время на отрисовку полей
      setTimeout(() => {
        // Заполняем поля значениями КИЗ
        const filledCount = fillAllKizFields(kizValues);
        console.log(`Заполнено ${filledCount} полей КИЗ`);
        
        resolve({
          success: true,
          fieldsCreated: fieldsToCreate,
          filledCount: filledCount,
          message: `Заполнено ${filledCount} полей КИЗ`
        });
      }, 1500); // Увеличиваем ожидание до 1.5 секунд
    });
  });
}

// Функция для создания пакета полей
function createFieldsBatch(addButton, batchSize, processedFields, totalFields) {
  return new Promise(resolve => {
    // Создаем все поля
    for (let i = 0; i < batchSize; i++) {
      const currentFieldIndex = processedFields + i;
      console.log(`Нажимаем кнопку "Добавить КИЗ" (${currentFieldIndex + 1}/${totalFields})`);
      
      // Отправляем обновление о прогрессе каждые 5 нажатий или на последнем
      if (i % 5 === 0 || i === batchSize - 1) {
        chrome.runtime.sendMessage({
          type: "PROGRESS_UPDATE",
          message: `Нажимаем кнопку "Добавить КИЗ" (${currentFieldIndex + 1}/${totalFields})`
        });
      }
      
      addButton.click();
    }
    
    // Разрешаем промис без проверки полей - проверка будет выполнена после создания всех пакетов
    setTimeout(resolve, 300); // Небольшая пауза для стабильности
  });
}

// Заполнение всех полей КИЗ
function fillAllKizFields(kizValues) {
  console.log('Заполняем все поля КИЗ...');
  
  // Находим все поля для ввода КИЗ с правильным pattern
  const kizInputs = document.querySelectorAll('input[name^="product.extra_inf.good_identification_numbers[0].cis["]');
  console.log(`Найдено ${kizInputs.length} полей для ввода КИЗ`);
  
  chrome.runtime.sendMessage({
    type: "PROGRESS_UPDATE",
    message: `Найдено ${kizInputs.length} полей для ввода КИЗ`
  });
  
  if (kizInputs.length === 0) {
    console.log('Не найдены поля для ввода КИЗ');
    chrome.runtime.sendMessage({
      type: "PROGRESS_UPDATE",
      message: `Ошибка: не найдены поля для ввода КИЗ`
    });
    return 0;
  }
  
  let filledCount = 0;
  
  // Заполняем поля значениями из массива kizValues
  for (let i = 0; i < Math.min(kizInputs.length, kizValues.length); i++) {
    const input = kizInputs[i];
    const kizValue = kizValues[i];
    
    console.log(`Заполняем поле ${i} значением: ${kizValue}`);
    
    // Отправляем обновление о прогрессе каждые 10 полей или на последнем
    if (i % 10 === 0 || i === Math.min(kizInputs.length, kizValues.length) - 1) {
      chrome.runtime.sendMessage({
        type: "PROGRESS_UPDATE",
        message: `Заполнение поля ${i + 1} из ${Math.min(kizInputs.length, kizValues.length)}`
      });
    }
    
    // Устанавливаем значение
    input.value = kizValue;
    
    // Создаем события ввода и изменения для активации валидации
    const inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);
    
    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);
    
    filledCount++;
  }
  
  console.log(`Всего заполнено ${filledCount} полей КИЗ`);
  chrome.runtime.sendMessage({
    type: "PROGRESS_UPDATE",
    message: `Всего заполнено ${filledCount} полей КИЗ`
  });
  
  return filledCount;
}

// Обработчик сообщений от popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Получено сообщение от popup:', message);
  
  if (message.type === "CLICK_ADD_BUTTON") {
    console.log('Обрабатываем сообщение CLICK_ADD_BUTTON');
    
    const button = findAddButton();
    if (button) {
      button.click();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
    
    return true; // Показываем, что собираемся отвечать асинхронно
  }
  
  if (message.type === "FILL_KIZ_FIELD") {
    console.log('Обрабатываем сообщение FILL_KIZ_FIELD с значением:', message.kizValue);
    
    const success = findAndFillKizField(message.kizValue);
    sendResponse({ success: success });
    
    return true; // Показываем, что собираемся отвечать асинхронно
  }
  
  if (message.type === "FIND_LAST_KIZ_INDEX") {
    console.log('Обрабатываем сообщение FIND_LAST_KIZ_INDEX');
    
    const lastIndex = findLastKizFieldIndex();
    sendResponse({ lastIndex: lastIndex });
    
    return true; // Показываем, что собираемся отвечать асинхронно
  }
  
  if (message.type === "CREATE_AND_FILL_KIZ_FIELDS") {
    console.log('Обрабатываем сообщение CREATE_AND_FILL_KIZ_FIELDS');
    console.log('Количество значений КИЗ для заполнения:', message.kizValues.length);
    
    // Вызываем функцию, которая возвращает Promise
    createAndFillKizFields(message.kizValues).then(result => {
      sendResponse(result);
    }).catch(error => {
      console.error('Произошла ошибка при создании и заполнении полей КИЗ:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    });
    
    return true; // Показываем, что собираемся отвечать асинхронно
  }
});
