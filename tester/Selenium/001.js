const {Builder, By, Key, until} = require('selenium-webdriver');

(async () => {
  let driver = await new Builder().forBrowser('internet explorer').build(); // create a driver instance
  await driver.manage().window().maximize(); // maximize browser window
  await driver.get('http://localhost:8000/'); // navigate to forcelayout memo

  driver.executeScript('memo0.loadFile(\'tester/Selenium/001.json\');');
  
})();
