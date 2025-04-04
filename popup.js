console.log('popup.js загружен');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded сработал');
  
  // Элементы для обработки CSV
  const csvFileInput = document.getElementById('csv-file-input');
  const csvFileInfo = document.getElementById('csv-file-info');
  const processCsvButton = document.getElementById('process-csv-button');
  const fillMultipleKizButton = document.getElementById('fill-multiple-kiz-button');
  const statusDiv = document.getElementById('status');
  const progressContainer = document.getElementById('progress-container');
  const progressDetails = document.getElementById('progress-details');

  // Глобальная переменная для хранения данных КИЗ
  let globalKizValues = [];

  // Слушатель сообщений от content.js
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Получено сообщение в popup:', message);
    
    // Отображаем сообщения о прогрессе
    if (message.type === "PROGRESS_UPDATE") {
      addProgressMessage(message.message);
    }
    
    return true;
  });

  // Функция для добавления сообщения о прогрессе
  function addProgressMessage(message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.margin = '5px 0';
    messageElement.style.borderBottom = '1px dashed #ddd';
    messageElement.style.paddingBottom = '5px';
    
    progressDetails.appendChild(messageElement);
    
    // Прокручиваем до последнего сообщения
    progressDetails.scrollTop = progressDetails.scrollHeight;
    
    // Убеждаемся, что контейнер прогресса видим
    progressContainer.style.display = 'block';
    
    // Также выводим в консоль для отладки
    console.log(message);
  }
  
  // Очистка сообщений о прогрессе
  function clearProgressMessages() {
    progressDetails.innerHTML = '';
    progressContainer.style.display = 'none';
  }

  // Отображение статуса
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
    
    // Добавляем автоматическое скрытие через 10 секунд для успешных сообщений
    if (type === 'success') {
      setTimeout(() => {
        if (statusDiv.textContent === message) {
          statusDiv.style.display = 'none';
        }
      }, 10000);
    }
  }
  
  // Форматирование размера файла
  function formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' байт';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' КБ';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
    }
  }
  
  // Слушатель выбора CSV файла
  csvFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) {
      csvFileInfo.textContent = 'Файл не выбран';
      processCsvButton.disabled = true;
      return;
    }
    
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      showStatus('Пожалуйста, выберите файл CSV или TXT', 'error');
      csvFileInfo.textContent = 'Неверный формат файла';
      processCsvButton.disabled = true;
      return;
    }
    
    // Показываем информацию о файле
    csvFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
    processCsvButton.disabled = false;
  });
  
  // Функция для корректного разбора CSV-строки с учетом запятых и кавычек
  function parseCSVLine(line) {
    const result = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Проверяем, является ли это экранированной кавычкой (двойная кавычка)
        if (i + 1 < line.length && line[i + 1] === '"' && insideQuotes) {
          currentValue += '"'; // Добавляем одну кавычку для экранированной двойной кавычки
          i++; // Пропускаем следующую кавычку
        } else {
          insideQuotes = !insideQuotes; // Переключаем флаг нахождения внутри кавычек
        }
      } else if (char === ',' && !insideQuotes) {
        // Запятая вне кавычек означает конец значения
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Добавляем последнее значение
    result.push(currentValue);
    
    return result;
  }
  
  // Создаем контейнер для отображения результатов прямо в интерфейсе
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'csv-results';
  document.body.appendChild(resultsContainer);
  resultsContainer.style.display = 'none';
  
  // Слушатель кнопки "Обработать файл"
  processCsvButton.addEventListener('click', function() {
    console.log('Нажата кнопка "Обработать файл"');
    
    // Очищаем результаты предыдущей обработки
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
    
    // Очищаем сообщения о прогрессе
    clearProgressMessages();
    
    // Сначала отключаем кнопку заполнения КИЗ
    fillMultipleKizButton.disabled = true;
    
    const file = csvFileInput.files[0];
    if (!file) {
      showStatus('Файл не выбран', 'error');
      return;
    }
    
    showStatus('Обработка файла...', 'info');
    processCsvButton.disabled = true;
    processCsvButton.textContent = 'Обработка...';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      console.log('📄 Файл успешно прочитан');
      const contents = e.target.result;
      const fileName = file.name;
      
      // Обрабатываем содержимое файла (определяем тип и формат)
      const kizValues = processFileContents(contents, fileName);
      
      if (kizValues.length === 0 || kizValues[0].values.length === 0) {
        showStatus('Не найдено значений КИЗ в файле', 'error');
        processCsvButton.disabled = false;
        processCsvButton.textContent = 'Обработать файл';
        return;
      }
      
      // Сохраняем данные КИЗ глобально
      globalKizValues = kizValues;
      
      // Выводим информацию о найденных значениях КИЗ
      const totalValues = kizValues.reduce((total, row) => total + row.values.length, 0);
      showStatus(`Найдено ${totalValues} значений КИЗ`, 'success');
      addProgressMessage(`✅ Найдено всего ${totalValues} значений КИЗ`);
      
      // Включаем кнопку заполнения полей КИЗ
      fillMultipleKizButton.disabled = false;
      processCsvButton.disabled = false;
      processCsvButton.textContent = 'Обработать файл';
      
      // Отображаем результаты обработки
      resultsContainer.innerHTML = '';
      resultsContainer.style.display = 'block';
      
      const resultsHeader = document.createElement('h3');
      resultsHeader.textContent = 'Результаты обработки файла:';
      resultsHeader.style.fontSize = '14px';
      resultsHeader.style.marginTop = '15px';
      resultsHeader.style.marginBottom = '5px';
      resultsContainer.appendChild(resultsHeader);
      
      const exampleHeader = document.createElement('p');
      exampleHeader.textContent = 'Примеры найденных значений КИЗ:';
      exampleHeader.style.fontSize = '12px';
      exampleHeader.style.margin = '5px 0';
      resultsContainer.appendChild(exampleHeader);
      
      const exampleList = document.createElement('ul');
      const limit = Math.min(5, kizValues.length);
      
      for (let i = 0; i < limit; i++) {
        const kizRow = kizValues[i];
        if (kizRow.values.length > 0) {
          const item = document.createElement('li');
          item.textContent = `Строка ${i + 1}: ${kizRow.values[0]}${kizRow.values.length > 1 ? ` (+ ещё ${kizRow.values.length - 1})` : ''}`;
          exampleList.appendChild(item);
        }
      }
      
      resultsContainer.appendChild(exampleList);
      
      // Добавляем сообщение про возможную длительную загрузку
      const warningMessage = document.createElement('p');
      warningMessage.innerHTML = '<strong>Важно:</strong> После нажатия кнопки "Заполнить все поля КИЗ", значения будут отправлены на страницу. ' +
        'Загрузка может занять некоторое время (до нескольких минут), но ваши данные будут отправлены.';
      warningMessage.style.fontSize = '12px';
      warningMessage.style.marginTop = '10px';
      warningMessage.style.padding = '8px';
      warningMessage.style.backgroundColor = '#fff3e0';
      warningMessage.style.border = '1px solid #ffcc80';
      warningMessage.style.borderRadius = '4px';
      
      resultsContainer.appendChild(warningMessage);
    };
    
    reader.onerror = function(error) {
      console.error('❌ Ошибка при чтении файла:', error);
      showStatus('Ошибка чтения файла', 'error');
      processCsvButton.disabled = false;
      processCsvButton.textContent = 'Обработать файл';
    };
    
    reader.readAsText(file, 'UTF-8'); // Явно указываем кодировку UTF-8
  });
  
  // Обработчик для кнопки "Заполнить все поля КИЗ из CSV"
  fillMultipleKizButton.addEventListener('click', function() {
    console.log('Нажата кнопка "Заполнить все поля КИЗ из CSV"');
    addProgressMessage('Начинаем заполнение полей КИЗ...');
    
    // Проверяем, есть ли данные для заполнения
    if (globalKizValues.length === 0 || !globalKizValues[0].values || globalKizValues[0].values.length === 0) {
      showStatus('Нет данных КИЗ для заполнения полей', 'error');
      addProgressMessage('⚠️ Нет данных КИЗ для заполнения');
      return;
    }
    
    // Получаем все значения КИЗ из первой строки
    const kizValues = globalKizValues[0].values;
    console.log('Выбрано значений КИЗ для заполнения:', kizValues.length);
    addProgressMessage(`Найдено ${kizValues.length} значений КИЗ для заполнения`);
    
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      // Проверяем, соответствует ли URL сайту clothes.crpt.ru
      if (!activeTab.url.includes('clothes.crpt.ru')) {
        showStatus('Это расширение работает только на сайте clothes.crpt.ru', 'error');
        addProgressMessage('⚠️ Ошибка: расширение работает только на сайте clothes.crpt.ru');
        return;
      }
      
      addProgressMessage('Отправка данных на страницу...');
      
      // Отправляем запрос на создание и заполнение полей КИЗ
      chrome.tabs.sendMessage(activeTab.id, {
        type: "CREATE_AND_FILL_KIZ_FIELDS",
        kizValues: kizValues
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Ошибка подключения к странице. Обновите страницу и попробуйте снова.', 'error');
          addProgressMessage('⚠️ Ошибка подключения к странице');
        } else if (response && response.success) {
          showStatus(`Успешно создано и заполнено ${response.filledCount} полей КИЗ`, 'success');
          addProgressMessage(`✅ Успешно создано и заполнено ${response.filledCount} полей КИЗ`);
        } else {
          showStatus('Не удалось создать или заполнить поля КИЗ на странице', 'error');
          addProgressMessage('⚠️ Не удалось создать или заполнить поля КИЗ');
        }
      });
    });
  });
  
  // Функция для обработки содержимого файла (определяет тип файла и обрабатывает соответственно)
  function processFileContents(contents, fileName) {
    console.log('📄 Обработка содержимого файла...');
    
    // Отладочный вывод начала содержимого
    console.log('Первые 50 символов файла:', contents.substring(0, 50));
    
    const lines = contents.split(/\r?\n/).filter(line => line.trim() !== '');
    console.log(`📊 Файл прочитан, всего строк: ${lines.length}`);
    addProgressMessage(`Файл прочитан, всего строк: ${lines.length}`);
    
    if (lines.length === 0) {
      showStatus('Файл не содержит данных', 'error');
      processCsvButton.disabled = false;
      processCsvButton.textContent = 'Обработать файл';
      return;
    }
    
    // Автоматическое определение формата файла
    let isTxtFile = fileName.endsWith('.txt');
    
    // Дополнительное определение формата по содержимому
    // Если файл содержит запятые, кавычки или имеет другие признаки CSV
    const csvIndicators = lines[0].includes('КИЗ');
    const isCsvFormat = csvIndicators || (!isTxtFile && lines[0].includes('киз'));
    
    console.log(`Определен формат файла: ${isCsvFormat ? 'CSV' : 'TXT'}`);
    addProgressMessage(`Определен формат файла: ${isCsvFormat ? 'CSV' : 'TXT'}`);
    
    // Обработка файла в зависимости от формата
    let kizValues = [];
    
    if (isCsvFormat) {
      // Обработка CSV формата
      kizValues = processCSVFormat(lines);
    } else {
      // Обработка TXT формата (одно значение в строке)
      kizValues = processTXTFormat(lines);
    }
    
    return kizValues;
  }

  // Обработка файла в формате CSV
  function processCSVFormat(lines) {
    console.log('Обработка в формате CSV...');
    addProgressMessage('Обработка в формате CSV...');
    
    const kizValues = [];
    let kizRow = { values: [] };
    
    // Проверяем первую строку на наличие заголовков
    const firstLine = lines[0];
    const isHeader = firstLine.toLowerCase().includes('киз') || 
                    firstLine.toLowerCase().includes('кис') || 
                    firstLine.toLowerCase().includes('kiz') || 
                    firstLine.toLowerCase().includes('cis');
    
    // Начинаем со второй строки, если первая - заголовок
    const startIndex = isHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      const values = parseCSVLine(line);
      
      // Если найдены какие-либо значения в строке
      if (values && values.length > 0) {
        // Обрабатываем каждое значение в строке
        for (let j = 0; j < values.length; j++) {
          let value = values[j].trim();
          if (value) {
            kizRow.values.push(value);
          }
        }
      }
    }
    
    // Добавляем обработанную строку в результат
    if (kizRow.values.length > 0) {
      kizValues.push(kizRow);
    }
    
    return kizValues;
  }

  // Обработка файла в формате TXT (по одному значению в строке)
  function processTXTFormat(lines) {
    console.log('Обработка в формате TXT...');
    addProgressMessage('Обработка в формате TXT...');
    
    const kizValues = [];
    let kizRow = { values: [] };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      // В TXT файле - каждая строка одно значение, обрезаем до 31 символа
      let value = line.substring(0, 31);
      
      if (value) {
        kizRow.values.push(value);
      }
    }
    
    // Добавляем обработанную строку в результат
    if (kizRow.values.length > 0) {
      kizValues.push(kizRow);
    }
    
    return kizValues;
  }
});
