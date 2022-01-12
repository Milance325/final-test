'use strict';

const { Builder, By, until, Key } = require('selenium-webdriver');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
chai.should();
const chrome = require('selenium-webdriver/chrome');

describe('Grupa 9 - Solution to the final test', function() {
    let driver;

    const regFirstName = 'Regina';
    const regLastName = 'Phalange';
    const regEmail = 'regina@phalange.local';
    const regUsername = 'regina_phalange';
    const regPassword = 'FingerQueenPhalange';

    const sideDishes = {
        ff: 'French fries',
        or: 'Onion rings'
    };

    let packages = [
        { package: 'Burger', side: 'ff', quantity: 2, price: 0 },
        { package: 'Burger', side: 'or', quantity: 1, price: 0 },
        { package: 'Double', side: 'ff', quantity: 5, price: 0 }
    ];

    before(async function() {
        // Replace path with chromedriver location on your own computer
        let service = new chrome.ServiceBuilder('/usr/local/lib/chromedriver/chromedriver').build();
        chrome.setDefaultService(service);

        driver = await new Builder().forBrowser('chrome').build();
    });

    after(function() {
        return driver.quit();
    });

    it('Registers a new user', async function() {
        await driver.get('http://test.qa.rs/');

        expect(await driver.getCurrentUrl()).to.eq('http://test.qa.rs/');

        const registerLnk = await driver.findElement(By.linkText('Register'));
        await registerLnk.click();

        expect(await driver.findElement(By.name('register')).isDisplayed()).to.eq(true);

        const fname = await driver.findElement(By.name('firstname'));
        fname.sendKeys(regFirstName);

        const lname = await driver.findElement(By.name('lastname'));
        lname.sendKeys(regLastName);

        const email = await driver.findElement(By.name('email'));
        email.sendKeys(regEmail);

        const uname = await driver.findElement(By.name('username'));
        uname.sendKeys(regUsername);

        const pass = await driver.findElement(By.name('password'));
        pass.sendKeys(regPassword);

        const passAgain = await driver.findElement(By.name('passwordAgain'));
        passAgain.sendKeys(regPassword);

        const register = await driver.findElement(By.name('register'));
        await register.click();

        expect(await driver.findElement(By.className('alert alert-success')).getText()).to.contain('Success!');
    });

    it('Goes to login page and performs login', async function() {
        const loginLnk = await driver.findElement(By.linkText('Login'))
        await loginLnk.click();

        expect(await driver.findElement(By.css('h2')).getText()).to.contain('Login');

        const username = await driver.findElement(By.name('username'));
        username.sendKeys(regUsername);

        const password = await driver.findElement(By.name('password'));
        password.sendKeys(regPassword);

        const loginBtn = await driver.findElement(By.name('login'));
        await loginBtn.click();

        expect(await driver.findElement(By.css('h2')).getText()).to.contain('Welcome back');
    });

    it('Adds items to shopping cart and verifies', async function() {
        for (const item of packages) {
            let itemName = await driver.findElement(By.xpath(`//h3[starts-with(., "${item.package}")]/ancestor::div[contains(@class, "panel panel-")]`));
            let sideDish = await itemName.findElement(By.name('side'));
            let options = await sideDish.findElements(By.css('option'));

            await Promise.all(options.map(async function(option) {
                const value = await option.getAttribute('value');
                if (value === item.side) {
                    await option.click();
    
                    const selectedValue = await sideDish.getAttribute('value');
                    expect(selectedValue).to.contain(item.side);

                    const quantity = await itemName.findElement(By.name('quantity'));
                    await quantity.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.DELETE, item.quantity);

                    const itemPrice = await itemName.findElement(By.className('panel-footer'));
                    item.price = Number((await itemPrice.getText()).replace(/\$/g, ''));
    
                    const orderButton = await itemName.findElement(By.className('btn btn-success'));
                    await orderButton.click();
    
                    expect(await driver.getCurrentUrl()).to.eq('http://test.qa.rs/order');

                    const itemRow = await driver.findElement(By.xpath(`//table//td[starts-with(., "${item.package.toUpperCase()}") and contains(., "${sideDishes[item.side]}")]/parent::tr`));
                    const columns = await itemRow.findElements(By.css('td'));
                    const itemQty = Number(await columns[1].getText());
                    const itemPpi = Number((await columns[2].getText()).replace(/\$/g, ''));
                    const itemTot = Number((await columns[3].getText()).replace(/\$/g, ''));

                    expect(itemQty).to.eq(item.quantity);
                    expect(itemPpi).to.eq(item.price);
                    expect(itemTot).to.eq(item.price * item.quantity);

                    const continueShoppingLnk = await driver.findElement(By.className('btn btn-default'));
                    expect(await continueShoppingLnk.getText()).to.contain('Continue');
                    await continueShoppingLnk.click();
                }
            }));
        };

        const shoppingCartLnk = await driver.findElement(By.partialLinkText('View shopping'));
        await shoppingCartLnk.click();
        expect(await driver.getCurrentUrl()).to.eq('http://test.qa.rs/cart');

        const totalPriceRow = await (await driver.findElement(By.xpath('//td[contains(., "Total:")]'))).getText();
        const totalPrice = Number(totalPriceRow.substring(totalPriceRow.indexOf('$') + 1));

        let totalExpected = 0;
        for (const item of packages) {
            totalExpected += item.price * item.quantity;
        }
        expect(totalExpected).to.eq(totalPrice);

        const checkoutLnk = await driver.findElement(By.name('checkout'));
        await checkoutLnk.click();
        expect(await driver.getCurrentUrl()).to.eq('http://test.qa.rs/checkout');

        const checkoutTotalText = await (await driver.findElement(By.xpath('//h3[contains(., "has been charged")]'))).getText();
        const checkoutTotal = Number(checkoutTotalText.substring(checkoutTotalText.indexOf('$') + 1));

        expect(totalExpected).to.eq(checkoutTotal);
    });

    it('Logout', async function() {
        const logoutLnk= await driver.findElement(By.partialLinkText('Logout'));
        await logoutLnk.click();

        expect(await driver.getCurrentUrl()).to.eq('http://test.qa.rs/');
    });
});