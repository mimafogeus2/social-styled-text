import chrome from 'sinon-chrome';
global.chrome = chrome;

function setButtonInPage() {
    document.body.innerHTML = '<button class="bolderize">Bolderize</button>';
}

function spyOnClickCallback(bolderizeButton) {
    const originalAddEventListener = bolderizeButton.addEventListener;
    const spy = jest.fn();
    jest.spyOn(bolderizeButton, 'addEventListener').mockImplementation((eventName, cb) => {
        spy.mockImplementation(cb);
        originalAddEventListener(eventName, spy);
    });
    return spy;
}

describe(`popup`, function () {
    let bolderizeButton;

    beforeEach(function () {
        setButtonInPage();
        bolderizeButton = document.querySelector('.bolderize');
    });

    afterEach(function () {
        jest.restoreAllMocks();
    });

    it(`should set a listener on the bolderize button`, async function () {
        const spy = spyOnClickCallback(bolderizeButton);
        await import('./popup.js');

        bolderizeButton.click();

        expect(spy).toHaveBeenCalled();
    });

    it(`should work on current tab`, async function () {
        jest.spyOn(chrome.tabs, 'query');

        await import('./popup.js');

        bolderizeButton.click();

        expect(chrome.tabs.query).toHaveBeenCalledWith({active: true, currentWindow: true}, expect.any(Function));
    });

    it('should replace the text of the button with bold text', async function () {
        jest.spyOn(chrome.tabs, 'query').mockImplementation((options, cb) => {
            cb([{id: 1, title: 'test'}]);
        });
        chrome.scripting = {
            executeScript: (options, cb) => {
                const result = options.args ? options.func(...options.args) : options.func()
                cb ? cb([{result}]) : null;
            },
        };
        const textElement = document.createElement('div');
        textElement.innerHTML = '<span>Bolderize</span>';
        document.body.appendChild(textElement);

        await import('./popup.js');
        window.getSelection().selectAllChildren(textElement);
        bolderizeButton.click();
        const actualText = textElement.textContent.trim();

        expect(actualText).toEqual('𝗕𝗼𝗹𝗱𝗲𝗿𝗶𝘇𝗲');
    });
});
