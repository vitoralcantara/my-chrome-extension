var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { saveOptions, getOptions } from './storage';
export function getUserSettings() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const opts = yield getOptions();
        return (_a = opts.someSetting) !== null && _a !== void 0 ? _a : null;
    });
}
export function saveUserSettings(value) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = { someSetting: value };
        yield saveOptions(opts);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('options-form');
    const inputField = document.getElementById('input-field');
    // Load saved options
    getOptions().then((options) => {
        inputField.value = options.someSetting || '';
    });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const newOptions = {
            someSetting: inputField.value,
        };
        saveOptions(newOptions);
    });
});
