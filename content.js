// ==UserScript==
// @name         УПД: Тест нажатия кнопки
// @version      2025.04.03.11
// @description  Тест функции нажатия кнопки
// ==/UserScript==

console.log('Расширение УПД 2025.04.03.11 (тест кнопки) активировано');

// Поиск кнопки "Добавить вручную"
function findAddButton() {
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
  
  // Ищем поле ввода по имени (атрибут name)
  const kizInput = document.querySelector('input[name="product.extra_inf.good_identification_numbers[0].id"]');
  
  if (kizInput) {
    console.log('Найдено поле для ввода КИЗ:', kizInput);
    
    // Устанавливаем значение
    kizInput.value = kizValue;
    
    // Создаем событие ввода для активации валидации и других обработчиков
    const inputEvent = new Event('input', { bubbles: true });
    kizInput.dispatchEvent(inputEvent);
    
    // Создаем событие изменения для активации валидации и других обработчиков
    const changeEvent = new Event('change', { bubbles: true });
    kizInput.dispatchEvent(changeEvent);
    
    console.log('Поле КИЗ успешно заполнено значением:', kizValue);
    return true;
  } else {
    console.log('Поле для ввода КИЗ не найдено');
    
    // Попробуем найти по более общему селектору (по классу и типу)
    const inputs = document.querySelectorAll('input.MuiInputBase-input.MuiInput-input');
    console.log(`Найдено ${inputs.length} полей ввода с классом MuiInputBase-input`);
    
    for (const input of inputs) {
      if (input.id && input.id.startsWith('mui-') && input.required) {
        console.log('Найдено поле ввода, похожее на поле КИЗ:', input);
        
        // Устанавливаем значение
        input.value = kizValue;
        
        // Создаем события ввода и изменения
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
        
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
        
        console.log('Альтернативное поле успешно заполнено значением:', kizValue);
        return true;
      }
    }
    
    return false;
  }
}

// Поиск последнего индекса полей КИЗ
function findLastKizFieldIndex() {
  console.log('Ищем все поля для ввода КИЗ и определяем последний индекс...');
  
  // Используем CSS-селектор для поиска всех полей ввода с нужным шаблоном атрибута name
  const kizInputs = document.querySelectorAll('input[name^="product.extra_inf.good_identification_numbers"][name$=".id"]');
  console.log(`Найдено ${kizInputs.length} полей ввода КИЗ`);
  
  if (kizInputs.length === 0) {
    console.log('Поля для ввода КИЗ не найдены');
    return -1;
  }
  
  return kizInputs.length - 1;
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
});
