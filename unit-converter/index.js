import http from 'http';
import { URL } from 'url';

const port = process.env.PORT ? Number(process.env.PORT) : 3002;

const lengthUnitToMeters = {
  millimeter: 0.001,
  centimeter: 0.01,
  meter: 1,
  kilometer: 1000,
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.344
};

const weightUnitToGrams = {
  milligram: 0.001,
  gram: 1,
  kilogram: 1000,
  ounce: 28.349523125,
  pound: 453.59237
};

function convertLength(value, fromUnit, toUnit) {
  const fromFactor = lengthUnitToMeters[fromUnit];
  const toFactor = lengthUnitToMeters[toUnit];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error('Unsupported length unit');
  }
  const meters = value * fromFactor;
  return meters / toFactor;
}

function convertWeight(value, fromUnit, toUnit) {
  const fromFactor = weightUnitToGrams[fromUnit];
  const toFactor = weightUnitToGrams[toUnit];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error('Unsupported weight unit');
  }
  const grams = value * fromFactor;
  return grams / toFactor;
}

function toCelsius(value, unit) {
  if (unit === 'celsius') return value;
  if (unit === 'fahrenheit') return (value - 32) * (5 / 9);
  if (unit === 'kelvin') return value - 273.15;
  throw new Error('Unsupported temperature unit');
}

function fromCelsius(valueC, unit) {
  if (unit === 'celsius') return valueC;
  if (unit === 'fahrenheit') return valueC * (9 / 5) + 32;
  if (unit === 'kelvin') return valueC + 273.15;
  throw new Error('Unsupported temperature unit');
}

function convertTemperature(value, fromUnit, toUnit) {
  const celsius = toCelsius(value, fromUnit);
  return fromCelsius(celsius, toUnit);
}

function htmlLayout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.45; margin: 2rem; }
    header a { margin-right: 1rem; }
    form { display: grid; grid-template-columns: repeat(2, minmax(160px, 240px)); gap: .75rem 1rem; align-items: center; max-width: 560px; margin-top: 1rem; }
    label { font-weight: 600; }
    input, select, button { padding: .5rem .6rem; font-size: 1rem; }
    .row { grid-column: 1 / -1; }
    .result { margin-top: 1rem; padding: .75rem 1rem; background: #f6f8fa; border: 1px solid #e5e7eb; border-radius: 8px; display: inline-block; }
    .error { color: #b91c1c; font-weight: 600; }
  </style>
  <link rel="icon" href="data:," />
  </head>
<body>
  <header>
    <a href="/">Home</a>
    <a href="/length">Length</a>
    <a href="/weight">Weight</a>
    <a href="/temperature">Temperature</a>
  </header>
  <main>
    ${body}
  </main>
</body>
</html>`;
}

function homePage() {
  return htmlLayout('Unit Converter', `
    <h1>Unit Converter</h1>
    <p>Select a converter:</p>
    <ul>
      <li><a href="/length">Length Converter</a></li>
      <li><a href="/weight">Weight Converter</a></li>
      <li><a href="/temperature">Temperature Converter</a></li>
    </ul>
  `);
}

function lengthPage(query) {
  const value = query.get('value') ?? '';
  const from = query.get('from') ?? 'meter';
  const to = query.get('to') ?? 'kilometer';
  let resultHtml = '';
  let errorHtml = '';
  if (query.has('value') && query.has('from') && query.has('to')) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      errorHtml = '<div class="error">Please enter a numeric value.</div>';
    } else if (numericValue < 0) {
      errorHtml = '<div class="error">Please enter a non-negative value for length.</div>';
    } else {
      try {
        const converted = convertLength(numericValue, from, to);
        resultHtml = `<div class="result">${numericValue} ${from} = <strong>${converted}</strong> ${to}</div>`;
      } catch (e) {
        errorHtml = `<div class="error">${e.message}</div>`;
      }
    }
  }
  return htmlLayout('Length Converter', `
    <h1>Length Converter</h1>
    <form method="GET" action="/length">
      <label for="value">Value</label>
      <input id="value" name="value" type="number" step="any" min="0" value="${value}" required />

      <label for="from">From</label>
      ${unitSelect('from', from, Object.keys(lengthUnitToMeters))}

      <label for="to">To</label>
      ${unitSelect('to', to, Object.keys(lengthUnitToMeters))}

      <div class="row">
        <button type="submit">Convert</button>
      </div>
    </form>
    ${errorHtml || resultHtml}
  `);
}

function weightPage(query) {
  const value = query.get('value') ?? '';
  const from = query.get('from') ?? 'gram';
  const to = query.get('to') ?? 'kilogram';
  let resultHtml = '';
  let errorHtml = '';
  if (query.has('value') && query.has('from') && query.has('to')) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      errorHtml = '<div class="error">Please enter a numeric value.</div>';
    } else if (numericValue < 0) {
      errorHtml = '<div class="error">Please enter a non-negative value for weight.</div>';
    } else {
      try {
        const converted = convertWeight(numericValue, from, to);
        resultHtml = `<div class="result">${numericValue} ${from} = <strong>${converted}</strong> ${to}</div>`;
      } catch (e) {
        errorHtml = `<div class="error">${e.message}</div>`;
      }
    }
  }
  return htmlLayout('Weight Converter', `
    <h1>Weight Converter</h1>
    <form method="GET" action="/weight">
      <label for="value">Value</label>
      <input id="value" name="value" type="number" step="any" min="0" value="${value}" required />

      <label for="from">From</label>
      ${unitSelect('from', from, Object.keys(weightUnitToGrams))}

      <label for="to">To</label>
      ${unitSelect('to', to, Object.keys(weightUnitToGrams))}

      <div class="row">
        <button type="submit">Convert</button>
      </div>
    </form>
    ${errorHtml || resultHtml}
  `);
}

function temperaturePage(query) {
  const value = query.get('value') ?? '';
  const from = query.get('from') ?? 'celsius';
  const to = query.get('to') ?? 'fahrenheit';
  let resultHtml = '';
  let errorHtml = '';
  if (query.has('value') && query.has('from') && query.has('to')) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      errorHtml = '<div class="error">Please enter a numeric value.</div>';
    } else {
      try {
        const converted = convertTemperature(numericValue, from, to);
        resultHtml = `<div class="result">${numericValue} ${from} = <strong>${converted}</strong> ${to}</div>`;
      } catch (e) {
        errorHtml = `<div class="error">${e.message}</div>`;
      }
    }
  }
  return htmlLayout('Temperature Converter', `
    <h1>Temperature Converter</h1>
    <form method="GET" action="/temperature">
      <label for="value">Value</label>
      <input id="value" name="value" type="number" step="any" value="${value}" required />

      <label for="from">From</label>
      ${unitSelect('from', from, ['celsius', 'fahrenheit', 'kelvin'])}

      <label for="to">To</label>
      ${unitSelect('to', to, ['celsius', 'fahrenheit', 'kelvin'])}

      <div class="row">
        <button type="submit">Convert</button>
      </div>
    </form>
    ${errorHtml || resultHtml}
  `);
}

function unitSelect(name, selected, options) {
  const opts = options
    .map((opt) => `<option value="${opt}" ${opt === selected ? 'selected' : ''}>${capitalize(opt)}</option>`) // capitalized label
    .join('');
  return `<select id="${name}" name="${name}">${opts}</select>`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (url.pathname === '/') {
      res.end(homePage());
      return;
    }
    if (url.pathname === '/length') {
      res.end(lengthPage(url.searchParams));
      return;
    }
    if (url.pathname === '/weight') {
      res.end(weightPage(url.searchParams));
      return;
    }
    if (url.pathname === '/temperature') {
      res.end(temperaturePage(url.searchParams));
      return;
    }

    res.statusCode = 404;
    res.end(htmlLayout('Not Found', `<h1>404 Not Found</h1><p>The requested page does not exist.</p>`));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`Internal Server Error: ${error.message}`);
  }
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Unit converter running on http://localhost:${port}`);
});


