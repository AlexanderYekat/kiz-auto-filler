// ==UserScript==
// @name         УПД: Тест нажатия кнопки
// @version      2025.04.03.25
// @description  Тест функции нажатия кнопки
// ==/UserScript==

console.log('Расширение УПД 2025.04.03.25 (тест кнопки) активировано');

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
  
  console.log('Кнопка "Добавить КИЗ" не найдена, пробуем найти кнопку "Добавить вручную"');
  
  // Если не нашли кнопку "Добавить КИЗ", пробуем найти и нажать "Добавить вручную"
  const addManuallyButton = findAddManuallyButton();
  if (addManuallyButton) {
    console.log('Нажимаем кнопку "Добавить вручную"');
    addManuallyButton.click();
    
    // Даем время для обработки клика и обновления DOM
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Повторно ищем кнопку "Добавить КИЗ" после нажатия "Добавить вручную"');
        
        // Повторный поиск кнопки "Добавить КИЗ"
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent.trim() === 'Добавить КИЗ') {
            console.log('Найдена кнопка "Добавить КИЗ" после нажатия "Добавить вручную":', button);
            resolve(button);
            return;
          }
        }
        
        // Еще раз пробуем через структуру
        const grids = document.querySelectorAll('div.MuiGrid-root');
        for (const grid of grids) {
          const button = grid.querySelector('button.MuiButtonBase-root.MuiButton-root.css-mgv5rm');
          if (button && button.textContent.trim() === 'Добавить КИЗ') {
            console.log('Найдена кнопка "Добавить КИЗ" через структуру после нажатия "Добавить вручную":', button);
            resolve(button);
            return;
          }
        }
        
        console.log('Кнопка "Добавить КИЗ" не найдена даже после нажатия "Добавить вручную"');
        resolve(null);
      }, 1000); // Ждем 1 секунду для обновления DOM
    });
  }
  
  console.log('Кнопка "Добавить КИЗ" не найдена');
  return null;
}

// Поиск кнопки "Добавить вручную"
function findAddManuallyButton() {
  console.log('Ищем кнопку "Добавить вручную"...');
  
  // Получаем все div с классом MuiStack-root
  const stackDivs = document.querySelectorAll('div.MuiStack-root');
  console.log(`Найдено ${stackDivs.length} div с классом MuiStack-root`);
  
  // Проходим по каждому div и ищем в нем нужную кнопку
  for (const div of stackDivs) {
    if (div.className.includes('css-1ktmlak')) {
      console.log('Найден div с классом css-1ktmlak:', div);
      
      const button = div.querySelector('button');
      if (button && button.textContent.trim() === 'Добавить вручную') {
        console.log('Найдена кнопка "Добавить вручную":', button);
        return button;
      }
    }
  }
  
  console.log('Кнопка "Добавить вручную" не найдена');
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
  
  return new Promise((resolve, reject) => {
    // Отправляем сообщение о начале процесса
    chrome.runtime.sendMessage({
      type: "PROGRESS_UPDATE",
      message: `Начинаем создание и заполнение ${kizValues.length} полей КИЗ`
    });
    
    // Шаг 1: Найти кнопку "Добавить КИЗ"
    const buttonPromise = findAddButton();
    
    // Обрабатываем результат - может быть как Promise, так и прямой результат
    Promise.resolve(buttonPromise).then(addButton => {
      if (!addButton) {
        console.error('Не удалось найти кнопку "Добавить КИЗ"');
        chrome.runtime.sendMessage({
          type: "PROGRESS_UPDATE",
          message: `Ошибка: не удалось найти кнопку "Добавить КИЗ"`
        });
        
        reject(new Error('Не удалось найти кнопку "Добавить КИЗ"'));
        return;
      }
      
      // Шаг 2: Узнать, сколько полей нужно создать
      // Учитываем, что startIndex - это индекс последнего поля (0-based),
      // то есть, если startIndex = 0, то у нас уже есть 1 поле
      // если startIndex = 2, то у нас уже есть 3 поля (с индексами 0, 1, 2)
      const existingFieldCount = startIndex >= 0 ? startIndex + 1 : 0;
      
      // Теперь вычисляем точно, сколько полей нужно добавить
      const fieldsToCreate = Math.max(0, kizValues.length - existingFieldCount);
      const batchSize = 10; // Создаем по 10 полей за раз для оптимизации
      
      console.log(`Найдено ${existingFieldCount} существующих полей КИЗ (последний индекс: ${startIndex})`);
      console.log(`Необходимо создать ${fieldsToCreate} новых полей КИЗ`);
      
      chrome.runtime.sendMessage({
        type: "PROGRESS_UPDATE",
        message: `Найдено ${existingFieldCount} существующих полей. Создаем ${fieldsToCreate} новых полей КИЗ...`
      });
      
      // Если уже достаточно полей, пропускаем создание новых
      if (fieldsToCreate <= 0) {
        console.log('Достаточно полей уже существует, пропускаем создание');
        chrome.runtime.sendMessage({
          type: "PROGRESS_UPDATE",
          message: `Достаточно полей уже существует, переходим к заполнению...`
        });
        
        // Сразу переходим к заполнению
        setTimeout(() => {
          console.log(`Заполняем поля значениями КИЗ`);
          
          const filledCount = fillAllKizFields(kizValues);
          console.log(`Заполнено ${filledCount} полей КИЗ`);
          
          chrome.runtime.sendMessage({
            type: "PROGRESS_UPDATE",
            message: `Заполнено ${filledCount} полей КИЗ`
          });
          
          resolve({
            success: true,
            fieldsCreated: 0,
            filledCount: filledCount,
            message: `Заполнено ${filledCount} полей КИЗ`
          });
        }, 500);
        return;
      }
      
      // Шаг 3: Создать необходимое количество полей
      let processedFields = 0;
      
      // Рекурсивно создаем поля пакетами
      createFieldsBatch(addButton, batchSize, processedFields, fieldsToCreate).then(() => {
        console.log(`Все ${fieldsToCreate} полей КИЗ созданы`);
        
        // Шаг 4: Заполнить созданные поля
        chrome.runtime.sendMessage({
          type: "PROGRESS_UPDATE",
          message: `Все поля созданы, начинаем заполнение...`
        });
        
        // Даем браузеру время на отрисовку всех полей
        setTimeout(() => {
          console.log(`Заполняем поля значениями КИЗ`);
          
          const filledCount = fillAllKizFields(kizValues);
          console.log(`Заполнено ${filledCount} полей КИЗ`);
          
          chrome.runtime.sendMessage({
            type: "PROGRESS_UPDATE",
            message: `Заполнено ${filledCount} полей КИЗ`
          });
          
          resolve({
            success: true,
            fieldsCreated: fieldsToCreate,
            filledCount: filledCount,
            message: `Заполнено ${filledCount} полей КИЗ`
          });
        }, 1500); // Увеличиваем ожидание до 1.5 секунд
      });
    }).catch(error => {
      console.error('Ошибка при создании и заполнении полей КИЗ:', error);
      chrome.runtime.sendMessage({
        type: "PROGRESS_UPDATE",
        message: `Ошибка: ${error.message}`
      });
      reject(error);
    });
  });
}

// Функция для создания пакета полей
function createFieldsBatch(addButton, batchSize, processedFields, totalFields) {
  return new Promise(resolve => {
    // Определяем, сколько полей нужно создать в этом пакете
    // Не больше batchSize и не больше, чем осталось до totalFields
    const fieldsToCreateInBatch = Math.min(batchSize, totalFields - processedFields);
    
    console.log(`Создаем пакет из ${fieldsToCreateInBatch} полей (всего нужно ${totalFields})`);
    
    // Создаем только необходимое количество полей
    for (let i = 0; i < fieldsToCreateInBatch; i++) {
      const currentFieldIndex = processedFields + i;
      console.log(`Нажимаем кнопку "Добавить КИЗ" (${currentFieldIndex + 1}/${totalFields})`);
      
      // Отправляем обновление о прогрессе каждые 5 нажатий или на последнем
      if (i % 5 === 0 || i === fieldsToCreateInBatch - 1) {
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
    
    // Получаем кнопку, учитывая, что findAddButton теперь может возвращать Promise
    const buttonPromise = findAddButton();
    
    // Используем Promise.resolve для обработки как Promise, так и прямого результата
    Promise.resolve(buttonPromise).then(button => {
      if (button) {
        button.click();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    }).catch(error => {
      console.error('Ошибка при поиске кнопки:', error);
      sendResponse({ success: false, error: error.message });
    });
    
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
