// @flow

import { NativeModules } from 'react-native';
import I18n from './i18n';
const { RNI18n } = NativeModules;

const initialLanguages = RNI18n.languages;
I18n.locale = initialLanguages.length > 0 ? initialLanguages[0] : 'en';
export const getLanguages = RNI18n.getLanguages;
export default I18n;
