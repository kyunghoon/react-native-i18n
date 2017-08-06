// I18n.js
// =======
//
// This small library provides the Rails I18n API on the Javascript.
// You don't actually have to use Rails (or even Ruby) to use I18n.js.
// Just make sure you export all translations in an object like I18n:
//
//     I18n.translations.en = {
//       hello: "Hello World"
//     };
//
// See tests for specific formatting like numbers and dates.
//
var I18n = {};

// Use previously defined object if exists in current scope

// Just cache the Array#slice function.
var slice = Array.prototype.slice;

// Apply number padding.
var padding = function(number) {
  return ("0" + number.toString()).substr(-2);
};

// Set default days/months translations.
var DATE = {
  day_names: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  , abbr_day_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  , month_names: [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  , abbr_month_names: [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  , meridian: ["AM", "PM"]
};

// Set default number format.
var NUMBER_FORMAT = {
  precision: 3
  , separator: "."
  , delimiter: ","
  , strip_insignificant_zeros: false
};

// Set default currency format.
var CURRENCY_FORMAT = {
  unit: "$"
  , precision: 2
  , format: "%u%n"
  , sign_first: true
  , delimiter: ","
  , separator: "."
};

// Set default percentage format.
var PERCENTAGE_FORMAT = {
  unit: "%"
  , precision: 3
  , format: "%n%u"
  , separator: "."
  , delimiter: ""
};

// Set default size units.
var SIZE_UNITS = [null, "kb", "mb", "gb", "tb"];

// Other default options
var DEFAULT_OPTIONS = {
  // Set default locale. This locale will be used when fallback is enabled and
  // the translation doesn't exist in a particular locale.
  defaultLocale: "en"
  // Set the current locale to `en`.
  , locale: "en"
  // Set the translation key separator.
  , defaultSeparator: "."
  // Set the placeholder format. Accepts `{placeholder}}` and `%{placeholder}`.}
  , placeholder: /(?:\{\{|%\{)(.*?)(?:\}\}?)/gm
  // Set if engine should fallback to the default locale when a translation
  // is missing.
  , fallbacks: false
  // Set the default translation object.
  , translations: {}
  // Set missing translation behavior. 'message' will display a message
  // that the translation is missing, 'guess' will try to guess the string
  , missingBehaviour: 'message'
  // if you use missingBehaviour with 'message', but want to know that the
  // string is actually missing for testing purposes, you can prefix the
  // guessed string by setting the value here. By default, no prefix!
  , missingTranslationPrefix: ''
};

I18n.reset = function() {
  // Set default locale. This locale will be used when fallback is enabled and
  // the translation doesn't exist in a particular locale.
  I18n.defaultLocale = DEFAULT_OPTIONS.defaultLocale;

  // Set the current locale to `en`.
  I18n.locale = DEFAULT_OPTIONS.locale;

  // Set the translation key separator.
  I18n.defaultSeparator = DEFAULT_OPTIONS.defaultSeparator;

  // Set the placeholder format. Accepts `{{placeholder}}` and `%{placeholder}`.
  I18n.placeholder = DEFAULT_OPTIONS.placeholder;

  // Set if engine should fallback to the default locale when a translation
  // is missing.
  I18n.fallbacks = DEFAULT_OPTIONS.fallbacks;

  // Set the default translation object.
  I18n.translations = DEFAULT_OPTIONS.translations;

  // Set the default missing behaviour
  I18n.missingBehaviour = DEFAULT_OPTIONS.missingBehaviour;

  // Set the default missing string prefix for guess behaviour
  I18n.missingTranslationPrefix = DEFAULT_OPTIONS.missingTranslationPrefix;

};

// Much like `reset`, but only assign options if not already assigned
I18n.initializeOptions = function() {
  if (typeof(I18n.defaultLocale) === "undefined" && I18n.defaultLocale !== null)
    I18n.defaultLocale = DEFAULT_OPTIONS.defaultLocale;

  if (typeof(I18n.locale) === "undefined" && I18n.locale !== null)
    I18n.locale = DEFAULT_OPTIONS.locale;

  if (typeof(I18n.defaultSeparator) === "undefined" && I18n.defaultSeparator !== null)
    I18n.defaultSeparator = DEFAULT_OPTIONS.defaultSeparator;

  if (typeof(I18n.placeholder) === "undefined" && I18n.placeholder !== null)
    I18n.placeholder = DEFAULT_OPTIONS.placeholder;

  if (typeof(I18n.fallbacks) === "undefined" && I18n.fallbacks !== null)
    I18n.fallbacks = DEFAULT_OPTIONS.fallbacks;

  if (typeof(I18n.translations) === "undefined" && I18n.translations !== null)
    I18n.translations = DEFAULT_OPTIONS.translations;
};
I18n.initializeOptions();

// Return a list of all locales that must be tried before returning the
// missing translation message. By default, I18n will consider the inline option,
// current locale and fallback locale.
//
//     I18n.locales.get("de-DE");
//     // ["de-DE", "de", "en"]
//
// You can define custom rules for any locale. Just make sure you return a array
// containing all locales.
//
//     // Default the Wookie locale to English.
//     I18n.locales["wk"] = function(locale) {
//       return ["en"];
//     };
//
I18n.locales = {};

// Retrieve locales based on inline locale, current locale or default to
// I18n's detection.
I18n.locales.get = function(locale) {
  var result = I18n.locales[locale] || I18n.locales[I18n.locale] || I18n.locales["default"];

  if (typeof(result) === "function") {
    result = result(locale);
  }

  if (result instanceof Array === false) {
    result = [result];
  }

  return result;
};

// The default locale list.
I18n.locales["default"] = function(locale) {
  var locales = []
    , list = []
    , countryCode
    , count
  ;

  // Handle the inline locale option that can be provided to
  // the `I18n.t` options.
  if (locale) {
    locales.push(locale);
  }

  // Add the current locale to the list.
  if (!locale && I18n.locale) {
    locales.push(I18n.locale);
  }

  // Add the default locale if fallback strategy is enabled.
  if (I18n.fallbacks && I18n.defaultLocale) {
    locales.push(I18n.defaultLocale);
  }

  // Compute each locale with its country code.
  // So I18n will return an array containing both
  // `de-DE` and `de` locales.
  locales.forEach(function(locale){
    countryCode = locale.split("-")[0];

    if (!~list.indexOf(locale)) {
      list.push(locale);
    }

    if (I18n.fallbacks && countryCode && countryCode !== locale && !~list.indexOf(countryCode)) {
      list.push(countryCode);
    }
  });

  // No locales set? English it is.
  if (!locales.length) {
    locales.push("en");
  }

  return list;
};

// Hold pluralization rules.
I18n.pluralization = {};

// Return the pluralizer for a specific locale.
// If no specify locale is found, then I18n's default will be used.
I18n.pluralization.get = function(locale) {
  return I18n[locale] || I18n[I18n.locale] || I18n["default"];
};

// The default pluralizer rule.
// It detects the `zero`, `one`, and `other` scopes.
I18n.pluralization["default"] = function(count) {
  switch (count) {
    case 0: return ["zero", "other"];
    case 1: return ["one"];
    default: return ["other"];
  }
};

// Return current locale. If no locale has been set, then
// the current locale will be the default locale.
I18n.currentLocale = function() {
  return I18n.locale || I18n.defaultLocale;
};

// Check if value is different than undefined and null;
I18n.isSet = function(value) {
  return value !== undefined && value !== null;
};

// Find and process the translation using the provided scope and options.
// This is used internally by some functions and should not be used as an
// public API.
I18n.lookup = function(scope, options) {
  options = I18n.prepareOptions(options);

  var locales = I18n.locales.get(options.locale).slice()
    , requestedLocale = locales[0]
    , locale
    , scopes
    , translations
  ;

  scope = I18n.getFullScope(scope, options);

  while (locales.length) {
    locale = locales.shift();
    scopes = scope.split(I18n.defaultSeparator);
    translations = I18n.translations[locale];

    if (!translations) {
      continue;
    }

    while (scopes.length) {
      translations = translations[scopes.shift()];

      if (translations === undefined || translations === null) {
        break;
      }
    }

    if (translations !== undefined && translations !== null) {
      return translations;
    }
  }

  if (I18n.isSet(options.defaultValue)) {
    return options.defaultValue;
  }
};

// Rails changed the way the meridian is stored.
// It started with `date.meridian` returning an array,
// then it switched to `time.am` and `time.pm`.
// This function abstracts I18n difference and returns
// the correct meridian or the default value when none is provided.
I18n.meridian = function() {
  var time = I18n.lookup("time");
  var date = I18n.lookup("date");

  if (time && time.am && time.pm) {
    return [time.am, time.pm];
  } else if (date && date.meridian) {
    return date.meridian;
  } else {
    return DATE.meridian;
  }
};

// Merge serveral hash options, checking if value is set before
// overwriting any value. The precedence is from left to right.
//
//     I18n.prepareOptions({name: "John Doe"}, {name: "Mary Doe", role: "user"});
//     #=> {name: "John Doe", role: "user"}
//
I18n.prepareOptions = function() {
  var args = slice.call(arguments)
    , options = {}
    , subject
  ;

  while (args.length) {
    subject = args.shift();

    if (typeof(subject) != "object") {
      continue;
    }

    for (var attr in subject) {
      if (!subject.hasOwnProperty(attr)) {
        continue;
      }

      if (I18n.isSet(options[attr])) {
        continue;
      }

      options[attr] = subject[attr];
    }
  }

  return options;
};

// Generate a list of translation options for default fallbacks.
// `defaultValue` is also deleted from options as it is returned as part of
// the translationOptions array.
I18n.createTranslationOptions = function(scope, options) {
  var translationOptions = [{scope: scope}];

  // Defaults should be an array of hashes containing either
  // fallback scopes or messages
  if (I18n.isSet(options.defaults)) {
    translationOptions = translationOptions.concat(options.defaults);
  }

  // Maintain support for defaultValue. Since it is always a message
  // insert it in to the translation options as such.
  if (I18n.isSet(options.defaultValue)) {
    translationOptions.push({ message: options.defaultValue });
    delete options.defaultValue;
  }

  return translationOptions;
};

// Translate the given scope with the provided options.
I18n.translate = function(scope, options) {
  options = I18n.prepareOptions(options);

  var translationOptions = I18n.createTranslationOptions(scope, options);

  var translation;
  // Iterate through the translation options until a translation
  // or message is found.
  var translationFound =
    translationOptions.some(function(translationOption) {
      if (I18n.isSet(translationOption.scope)) {
        translation = I18n.lookup(translationOption.scope, options);
      } else if (I18n.isSet(translationOption.message)) {
        translation = translationOption.message;
      }

      if (translation !== undefined && translation !== null) {
        return true;
      }
    }, I18n);

  if (!translationFound) {
    return I18n.missingTranslation(scope, options);
  }

  if (typeof(translation) === "string") {
    translation = I18n.interpolate(translation, options);
  } else if (translation instanceof Object && I18n.isSet(options.count)) {
    translation = I18n.pluralize(options.count, translation, options);
  }

  return translation;
};

// This function interpolates the all variables in the given message.
I18n.interpolate = function(message, options) {
  options = I18n.prepareOptions(options);
  var matches = message.match(I18n.placeholder)
    , placeholder
    , value
    , name
    , regex
  ;

  if (!matches) {
    return message;
  }

  var value;

  while (matches.length) {
    placeholder = matches.shift();
    name = placeholder.replace(I18n.placeholder, "$1");

    if (I18n.isSet(options[name])) {
      value = options[name].toString().replace(/\$/gm, "_#$#_");
    } else if (name in options) {
      value = I18n.nullPlaceholder(placeholder, message);
    } else {
      value = I18n.missingPlaceholder(placeholder, message);
    }

    regex = new RegExp(placeholder.replace(/\{/gm, "\\{").replace(/\}/gm, "\\}"));
    message = message.replace(regex, value);
  }

  return message.replace(/_#\$#_/g, "$");
};

// Pluralize the given scope using the `count` value.
// The pluralized translation may have other placeholders,
// which will be retrieved from `options`.
I18n.pluralize = function(count, scope, options) {
  options = I18n.prepareOptions(options);
  var translations, pluralizer, keys, key, message;

  if (scope instanceof Object) {
    translations = scope;
  } else {
    translations = I18n.lookup(scope, options);
  }

  if (!translations) {
    return I18n.missingTranslation(scope, options);
  }

  pluralizer = I18n.pluralization.get(options.locale);
  keys = pluralizer(count);

  while (keys.length) {
    key = keys.shift();

    if (I18n.isSet(translations[key])) {
      message = translations[key];
      break;
    }
  }

  options.count = String(count);
  return I18n.interpolate(message, options);
};

// Return a missing translation message for the given parameters.
I18n.missingTranslation = function(scope, options) {
  //guess intended string
  if(I18n.missingBehaviour == 'guess'){
    //get only the last portion of the scope
    var s = scope.split('.').slice(-1)[0];
    //replace underscore with space && camelcase with space and lowercase letter
    return (I18n.missingTranslationPrefix.length > 0 ? I18n.missingTranslationPrefix : '') +
      s.replace('_',' ').replace(/([a-z])([A-Z])/g,
        function(match, p1, p2) {return p1 + ' ' + p2.toLowerCase()} );
  }

  var fullScope           = I18n.getFullScope(scope, options);
  var fullScopeWithLocale = [I18n.currentLocale(), fullScope].join(I18n.defaultSeparator);

  return '[missing "' + fullScopeWithLocale + '" translation]';
};

// Return a missing placeholder message for given parameters
I18n.missingPlaceholder = function(placeholder, message) {
  return "[missing " + placeholder + " value]";
};

I18n.nullPlaceholder = function() {
  return I18n.missingPlaceholder.apply(I18n, arguments);
};

// Format number using localization rules.
// The options will be retrieved from the `number.format` scope.
// If I18n isn't present, then the following options will be used:
//
// - `precision`: `3`
// - `separator`: `"."`
// - `delimiter`: `","`
// - `strip_insignificant_zeros`: `false`
//
// You can also override these options by providing the `options` argument.
//
I18n.toNumber = function(number, options) {
  options = I18n.prepareOptions(
    options
    , I18n.lookup("number.format")
    , NUMBER_FORMAT
  );

  var negative = number < 0
    , string = Math.abs(number).toFixed(options.precision).toString()
    , parts = string.split(".")
    , precision
    , buffer = []
    , formattedNumber
    , format = options.format || "%n"
    , sign = negative ? "-" : ""
  ;

  number = parts[0];
  precision = parts[1];

  while (number.length > 0) {
    buffer.unshift(number.substr(Math.max(0, number.length - 3), 3));
    number = number.substr(0, number.length -3);
  }

  formattedNumber = buffer.join(options.delimiter);

  if (options.strip_insignificant_zeros && precision) {
    precision = precision.replace(/0+$/, "");
  }

  if (options.precision > 0 && precision) {
    formattedNumber += options.separator + precision;
  }

  if (options.sign_first) {
    format = "%s" + format;
  }
  else {
    format = format.replace("%n", "%s%n");
  }

  formattedNumber = format
    .replace("%u", options.unit)
    .replace("%n", formattedNumber)
    .replace("%s", sign)
  ;

  return formattedNumber;
};

// Format currency with localization rules.
// The options will be retrieved from the `number.currency.format` and
// `number.format` scopes, in that order.
//
// Any missing option will be retrieved from the `I18n.toNumber` defaults and
// the following options:
//
// - `unit`: `"$"`
// - `precision`: `2`
// - `format`: `"%u%n"`
// - `delimiter`: `","`
// - `separator`: `"."`
//
// You can also override these options by providing the `options` argument.
//
I18n.toCurrency = function(number, options) {
  options = I18n.prepareOptions(
    options
    , I18n.lookup("number.currency.format")
    , I18n.lookup("number.format")
    , CURRENCY_FORMAT
  );

  return I18n.toNumber(number, options);
};

// Localize several values.
// You can provide the following scopes: `currency`, `number`, or `percentage`.
// If you provide a scope that matches the `/^(date|time)/` regular expression
// then the `value` will be converted by using the `I18n.toTime` function.
//
// It will default to the value's `toString` function.
//
I18n.localize = function(scope, value, options) {
  options || (options = {});

  switch (scope) {
    case "currency":
      return I18n.toCurrency(value);
    case "number":
      scope = I18n.lookup("number.format");
      return I18n.toNumber(value, scope);
    case "percentage":
      return I18n.toPercentage(value);
    default:
      var localizedValue;

      if (scope.match(/^(date|time)/)) {
        localizedValue = I18n.toTime(scope, value);
      } else {
        localizedValue = value.toString();
      }

      return I18n.interpolate(localizedValue, options);
  }
};

// Parse a given `date` string into a JavaScript Date object.
// This function is time zone aware.
//
// The following string formats are recognized:
//
//    yyyy-mm-dd
//    yyyy-mm-dd[ T]hh:mm::ss
//    yyyy-mm-dd[ T]hh:mm::ss
//    yyyy-mm-dd[ T]hh:mm::ssZ
//    yyyy-mm-dd[ T]hh:mm::ss+0000
//    yyyy-mm-dd[ T]hh:mm::ss+00:00
//    yyyy-mm-dd[ T]hh:mm::ss.123Z
//
I18n.parseDate = function(date) {
  var matches, convertedDate, fraction;
  // we have a date, so just return it.
  if (typeof(date) == "object") {
    return date;
  };

  matches = date.toString().match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2})([\.,]\d{1,3})?)?(Z|\+00:?00)?/);

  if (matches) {
    for (var i = 1; i <= 6; i++) {
      matches[i] = parseInt(matches[i], 10) || 0;
    }

    // month starts on 0
    matches[2] -= 1;

    fraction = matches[7] ? 1000 * ("0" + matches[7]) : null;

    if (matches[8]) {
      convertedDate = new Date(Date.UTC(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6], fraction));
    } else {
      convertedDate = new Date(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6], fraction);
    }
  } else if (typeof(date) == "number") {
    // UNIX timestamp
    convertedDate = new Date();
    convertedDate.setTime(date);
  } else if (date.match(/([A-Z][a-z]{2}) ([A-Z][a-z]{2}) (\d+) (\d+:\d+:\d+) ([+-]\d+) (\d+)/)) {
    // This format `Wed Jul 20 13:03:39 +0000 2011` is parsed by
    // webkit/firefox, but not by IE, so we must parse it manually.
    convertedDate = new Date();
    convertedDate.setTime(Date.parse([
      RegExp.$1, RegExp.$2, RegExp.$3, RegExp.$6, RegExp.$4, RegExp.$5
    ].join(" ")));
  } else if (date.match(/\d+ \d+:\d+:\d+ [+-]\d+ \d+/)) {
    // a valid javascript format with timezone info
    convertedDate = new Date();
    convertedDate.setTime(Date.parse(date));
  } else {
    // an arbitrary javascript string
    convertedDate = new Date();
    convertedDate.setTime(Date.parse(date));
  }

  return convertedDate;
};

// Formats time according to the directives in the given format string.
// The directives begins with a percent (%) character. Any text not listed as a
// directive will be passed through to the output string.
//
// The accepted formats are:
//
//     %a  - The abbreviated weekday name (Sun)
//     %A  - The full weekday name (Sunday)
//     %b  - The abbreviated month name (Jan)
//     %B  - The full month name (January)
//     %c  - The preferred local date and time representation
//     %d  - Day of the month (01..31)
//     %-d - Day of the month (1..31)
//     %H  - Hour of the day, 24-hour clock (00..23)
//     %-H - Hour of the day, 24-hour clock (0..23)
//     %I  - Hour of the day, 12-hour clock (01..12)
//     %-I - Hour of the day, 12-hour clock (1..12)
//     %m  - Month of the year (01..12)
//     %-m - Month of the year (1..12)
//     %M  - Minute of the hour (00..59)
//     %-M - Minute of the hour (0..59)
//     %p  - Meridian indicator (AM  or  PM)
//     %S  - Second of the minute (00..60)
//     %-S - Second of the minute (0..60)
//     %w  - Day of the week (Sunday is 0, 0..6)
//     %y  - Year without a century (00..99)
//     %-y - Year without a century (0..99)
//     %Y  - Year with century
//     %z  - Timezone offset (+0545)
//
I18n.strftime = function(date, format) {
  var options = I18n.lookup("date")
    , meridianOptions = I18n.meridian()
  ;

  if (!options) {
    options = {};
  }

  options = I18n.prepareOptions(options, DATE);

  var weekDay = date.getDay()
    , day = date.getDate()
    , year = date.getFullYear()
    , month = date.getMonth() + 1
    , hour = date.getHours()
    , hour12 = hour
    , meridian = hour > 11 ? 1 : 0
    , secs = date.getSeconds()
    , mins = date.getMinutes()
    , offset = date.getTimezoneOffset()
    , absOffsetHours = Math.floor(Math.abs(offset / 60))
    , absOffsetMinutes = Math.abs(offset) - (absOffsetHours * 60)
    , timezoneoffset = (offset > 0 ? "-" : "+") +
    (absOffsetHours.toString().length < 2 ? "0" + absOffsetHours : absOffsetHours) +
    (absOffsetMinutes.toString().length < 2 ? "0" + absOffsetMinutes : absOffsetMinutes)
  ;

  if (hour12 > 12) {
    hour12 = hour12 - 12;
  } else if (hour12 === 0) {
    hour12 = 12;
  }

  format = format.replace("%a", options.abbr_day_names[weekDay]);
  format = format.replace("%A", options.day_names[weekDay]);
  format = format.replace("%b", options.abbr_month_names[month]);
  format = format.replace("%B", options.month_names[month]);
  format = format.replace("%d", padding(day));
  format = format.replace("%e", day);
  format = format.replace("%-d", day);
  format = format.replace("%H", padding(hour));
  format = format.replace("%-H", hour);
  format = format.replace("%I", padding(hour12));
  format = format.replace("%-I", hour12);
  format = format.replace("%m", padding(month));
  format = format.replace("%-m", month);
  format = format.replace("%M", padding(mins));
  format = format.replace("%-M", mins);
  format = format.replace("%p", meridianOptions[meridian]);
  format = format.replace("%S", padding(secs));
  format = format.replace("%-S", secs);
  format = format.replace("%w", weekDay);
  format = format.replace("%y", padding(year));
  format = format.replace("%-y", padding(year).replace(/^0+/, ""));
  format = format.replace("%Y", year);
  format = format.replace("%z", timezoneoffset);

  return format;
};

// Convert the given dateString into a formatted date.
I18n.toTime = function(scope, dateString) {
  var date = I18n.parseDate(dateString)
    , format = I18n.lookup(scope)
  ;

  if (date.toString().match(/invalid/i)) {
    return date.toString();
  }

  if (!format) {
    return date.toString();
  }

  return I18n.strftime(date, format);
};

// Convert a number into a formatted percentage value.
I18n.toPercentage = function(number, options) {
  options = I18n.prepareOptions(
    options
    , I18n.lookup("number.percentage.format")
    , I18n.lookup("number.format")
    , PERCENTAGE_FORMAT
  );

  return I18n.toNumber(number, options);
};

// Convert a number into a readable size representation.
I18n.toHumanSize = function(number, options) {
  var kb = 1024
    , size = number
    , iterations = 0
    , unit
    , precision
  ;

  while (size >= kb && iterations < 4) {
    size = size / kb;
    iterations += 1;
  }

  if (iterations === 0) {
    unit = I18n.t("number.human.storage_units.units.byte", {count: size});
    precision = 0;
  } else {
    unit = I18n.t("number.human.storage_units.units." + SIZE_UNITS[iterations]);
    precision = (size - Math.floor(size) === 0) ? 0 : 1;
  }

  options = I18n.prepareOptions(
    options
    , {unit: unit, precision: precision, format: "%n%u", delimiter: ""}
  );

  return I18n.toNumber(size, options);
};

I18n.getFullScope = function(scope, options) {
  options = I18n.prepareOptions(options);

  // Deal with the scope as an array.
  if (scope.constructor === Array) {
    scope = scope.join(I18n.defaultSeparator);
  }

  // Deal with the scope option provided through the second argument.
  //
  //    I18n.t('hello', {scope: 'greetings'});
  //
  if (options.scope) {
    scope = [options.scope, scope].join(I18n.defaultSeparator);
  }

  return scope;
}

// Set aliases, so we can save some typing.
I18n.t = I18n.translate;
I18n.l = I18n.localize;
I18n.p = I18n.pluralize;

export default I18n;
