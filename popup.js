console.log('popup.js загружен');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded сработал');
  
  // Элементы для теста нажатия кнопки
  const clickButtonTestBtn = document.getElementById('click-button-test');
  const statusDiv = document.getElementById('status');
  
  console.log('Найдена кнопка:', clickButtonTestBtn);
  
  // Элементы для теста обработки CSV
  const csvFileInput = document.getElementById('csv-file-input');
  const csvFileInfo = document.getElementById('csv-file-info');
  const processCsvButton = document.getElementById('process-csv-button');
  const fillKizButton = document.getElementById('fill-kiz-button');
  const findLastIndexButton = document.getElementById('find-last-index-button');

  // Глобальная переменная для хранения данных КИЗ
  let globalKizValues = [];

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

  // Слушатель кнопки "Тест нажатия кнопки"
  clickButtonTestBtn.addEventListener('click', function() {
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      // Проверяем, соответствует ли URL сайту clothes.crpt.ru
      if (!activeTab.url.includes('clothes.crpt.ru')) {
        showStatus('Это расширение работает только на сайте clothes.crpt.ru', 'error');
        return;
      }
      
      // Отправляем запрос на нажатие кнопки
      chrome.tabs.sendMessage(activeTab.id, {
        type: "CLICK_ADD_BUTTON"
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Ошибка подключения к странице. Обновите страницу и попробуйте снова.', 'error');
        } else if (response && response.success) {
          showStatus('Кнопка "Добавить вручную" успешно нажата', 'success');
        } else {
          showStatus('Кнопка "Добавить вручную" не найдена на странице', 'error');
        }
      });
    });
  });
  
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
    
    if (!file.name.endsWith('.csv')) {
      showStatus('Пожалуйста, выберите файл CSV', 'error');
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
  resultsContainer.style.display = 'none';
  document.body.appendChild(resultsContainer);
  
  // Обработчик для кнопки "Обработать CSV-файл"
  processCsvButton.addEventListener('click', function() {
    console.log('Нажата кнопка "Обработать CSV-файл"');
    
    // Сбрасываем контейнер результатов
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
    
    // Сначала отключаем кнопку заполнения КИЗ
    fillKizButton.disabled = true;
    
    const file = csvFileInput.files[0];
    if (!file) {
      showStatus('Файл не выбран', 'error');
      return;
    }
    
    // Явно показываем, что начали обработку
    //console.clear();
    console.log('🔍 Начинаем обработку файла:', file.name);
    showStatus('Обработка CSV-файла...', 'info');
    processCsvButton.disabled = true;
    processCsvButton.textContent = 'Обработка...';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      console.log('📄 Файл успешно прочитан');
      const contents = e.target.result;
      
      // Отладочный вывод начала содержимого
      console.log('Первые 50 символов файла:', contents.substring(0, 50));
      
      const lines = contents.split(/\r?\n/);
      console.log('📊 CSV файл прочитан, всего строк:', lines.length);
      
      if (lines.length === 0) {
        console.log('⚠️ Файл не содержит строк');
        showStatus('Файл пуст или имеет неверный формат', 'error');
        processCsvButton.disabled = false;
        processCsvButton.textContent = 'Обработать CSV-файл';
        return;
      }
      
      // Отладочный вывод первой строки
      console.log('Первая строка CSV:', lines[0]);
      
      const kizValues = [];
      
      lines.forEach((line, index) => {
        if (!line.trim()) {
          console.log(`Строка ${index + 1}: пустая, пропускаем`);
          return; // Пропускаем пустые строки
        }
        
        try {
          const values = parseCSVLine(line);
          
          console.log(`Строка ${index + 1}: разбор завершен, найдено ${values.length} значений`);
          
          // Пропускаем первые два значения (1 и КИЗ) и обрабатываем только остальные
          if (values.length > 2) {
            // Выводим только значения КИЗ, начиная с третьего элемента (индекс 2)
            console.log(`Строка ${index + 1}, значения КИЗ:`, values.slice(2));
            
            // Сохраняем значения для возможного дальнейшего использования
            kizValues.push({
              values: values.slice(2)
            });
          } else {
            console.log(`⚠️ Строка ${index + 1}: недостаточно значений (${values.length}), ожидалось > 2`);
          }
        } catch (error) {
          console.error(`❌ Ошибка при обработке строки ${index + 1}:`, error);
        }
      });
      
      console.log('✅ Всего обработано записей с КИЗ:', kizValues.length);
      
      // Восстанавливаем кнопку
      processCsvButton.disabled = false;
      processCsvButton.textContent = 'Обработать CSV-файл';
      
      if (kizValues.length > 0) {
        showStatus(`Успешно обработано ${kizValues.length} записей из CSV-файла`, 'success');
        
        // Сохраняем КИЗы в глобальную переменную и активируем кнопку
        globalKizValues = kizValues;
        fillKizButton.disabled = false;
        
        // Отображаем результаты прямо в интерфейсе
        resultsContainer.style.display = 'block';
        const header = document.createElement('h3');
        header.textContent = 'Результаты обработки CSV:';
        resultsContainer.appendChild(header);
        
        const info = document.createElement('p');
        info.textContent = `Обработано ${kizValues.length} строк, извлечено ${kizValues.reduce((acc, row) => acc + row.values.length, 0)} значений КИЗ.`;
        resultsContainer.appendChild(info);
        
        // Показываем первые 5 строк с КИЗ в качестве примера
        if (kizValues.length > 0) {
          const exampleHeader = document.createElement('p');
          exampleHeader.innerHTML = '<strong>Примеры КИЗ:</strong>';
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
        }
      } else {
        showStatus('Не найдено записей с КИЗ в файле', 'error');
      }
    };
    
    reader.onerror = function(error) {
      console.error('❌ Ошибка чтения файла:', error);
      showStatus('Ошибка чтения файла', 'error');
      processCsvButton.disabled = false;
      processCsvButton.textContent = 'Обработать CSV-файл';
    };
    
    reader.readAsText(file, 'UTF-8'); // Явно указываем кодировку UTF-8
  });
  
  // Обработчик для кнопки "Заполнить поле КИЗ"
  fillKizButton.addEventListener('click', function() {
    console.log('Нажата кнопка "Заполнить поле КИЗ"');
    
    // Проверяем, есть ли данные для заполнения
    if (globalKizValues.length === 0 || !globalKizValues[0].values || globalKizValues[0].values.length === 0) {
      showStatus('Нет данных КИЗ для заполнения поля', 'error');
      return;
    }
    
    // Получаем первое значение КИЗ из первой строки
    const firstKizValue = globalKizValues[0].values[0];
    console.log('Выбрано значение КИЗ для заполнения:', firstKizValue);
    
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      // Проверяем, соответствует ли URL сайту clothes.crpt.ru
      if (!activeTab.url.includes('clothes.crpt.ru')) {
        showStatus('Это расширение работает только на сайте clothes.crpt.ru', 'error');
        return;
      }
      
      // Отправляем запрос на заполнение поля КИЗ
      chrome.tabs.sendMessage(activeTab.id, {
        type: "FILL_KIZ_FIELD",
        kizValue: firstKizValue
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Ошибка подключения к странице. Обновите страницу и попробуйте снова.', 'error');
        } else if (response && response.success) {
          showStatus('Поле КИЗ успешно заполнено', 'success');
        } else {
          showStatus('Не удалось найти поле КИЗ на странице', 'error');
        }
      });
    });
  });
  
  // Обработчик для кнопки "Найти последний индекс полей КИЗ"
  findLastIndexButton.addEventListener('click', function() {
    console.log('Нажата кнопка "Найти последний индекс полей КИЗ"');
    
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      // Проверяем, соответствует ли URL сайту clothes.crpt.ru
      if (!activeTab.url.includes('clothes.crpt.ru')) {
        showStatus('Это расширение работает только на сайте clothes.crpt.ru', 'error');
        return;
      }
      
      // Отправляем запрос на поиск последнего индекса полей КИЗ
      chrome.tabs.sendMessage(activeTab.id, {
        type: "FIND_LAST_KIZ_INDEX"
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Ошибка подключения к странице. Обновите страницу и попробуйте снова.', 'error');
        } else if (response) {
          if (response.lastIndex === -1) {
            showStatus('Не найдены поля для ввода КИЗ', 'info');
          } else {
            showStatus(`Найден последний индекс полей КИЗ: ${response.lastIndex}`, 'info');
          }
          console.log('Результат поиска последнего индекса полей КИЗ:', response);
        } else {
          showStatus('Не удалось получить ответ от страницы', 'error');
        }
      });
    });
  });
});
