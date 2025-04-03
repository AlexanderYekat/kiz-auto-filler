// ==UserScript==
// @name         УПД: Тест нажатия кнопки
// @version      2025.04.03.09
// @description  Тест функции нажатия кнопки
// ==/UserScript==

console.log('Расширение УПД 2025.04.03.09 (тест кнопки) активировано');

// Поиск кнопки "Добавить вручную"
function findAddButton() {
  // Находим все родительские div с классом MuiStack-root
  const stackDivs = document.querySelectorAll('div.MuiStack-root');
  console.log(`Найдено ${stackDivs.length} div с классом MuiStack-root`);
  
  // Ищем среди них div с классом css-1ktmlak, содержащий кнопку "Добавить вручную"
  for (const div of stackDivs) {
    if (div.className.includes('css-1ktmlak')) {
      const button = div.querySelector('button');
      if (button && button.textContent.trim() === 'Добавить вручную') {
        console.log('Найдена кнопка в div.MuiStack-root.css-1ktmlak:', button);
        return button;
      }
    }
  }

  // Если не нашли кнопку в указанном родителе, ищем все кнопки "Добавить вручную"
  console.log('Не найдена кнопка в целевом div, ищем все кнопки "Добавить вручную"');
  const allButtons = document.querySelectorAll('button');
  const targetButtons = Array.from(allButtons).filter(
    button => button.textContent.trim() === 'Добавить вручную'
  );
  
  console.log(`Найдено ${targetButtons.length} кнопок "Добавить вручную"`);
  
  // Выводим информацию о каждой найденной кнопке
  targetButtons.forEach((btn, index) => {
    console.log(`Кнопка "Добавить вручную" #${index}:`, {
      parentClass: btn.parentElement ? btn.parentElement.className : 'нет'
    });
  });
  
  // Возвращаем первую найденную кнопку, если есть
  if (targetButtons.length > 0) {
    console.log('Возвращаем первую найденную кнопку:', targetButtons[0]);
    return targetButtons[0];
  }
  
  console.log('Кнопки "Добавить вручную" не найдены');
  return null;
}

// Функция для нажатия на кнопку "Добавить вручную"
function clickAddButton() {
  const button = findAddButton();
  
  if (button) {
    console.log('Кнопка "Добавить вручную" найдена, нажимаем...');
    button.click();
    return true;
  } else {
    console.log('Кнопка "Добавить вручную" не найдена');
    return false;
  }
}

// Обработчик сообщений от popup.js
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === "CLICK_ADD_BUTTON") {
    console.log('Получен запрос на нажатие кнопки "Добавить вручную"');
    const success = clickAddButton();
    sendResponse({ success: success });
    return true;
  }
  return false;
});
