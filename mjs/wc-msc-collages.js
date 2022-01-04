import { _wcl } from './common-lib.js';
import { _wccss } from './common-css.js';
import Mustache from './mustache.js';

const defaults = {
  theme: 1, // 1 ~ 8`
  'object-fit': 'cover', // cover || contain
  collages: [] // { alt, link, src, target }
};

const objectAttrs = ['collages'];

const custumEvents = {
  click: 'msc-collages-click'
};

const template = document.createElement('template');
template.innerHTML = `
<style>
${_wccss}

:host{position:relative;display:block;}
:host {
  --msc-collages-gap: 1px;
  --msc-collages-overlay: #1d2228;
  --msc-collages-border-radius: 8px;
}

.collages {
  --w: 1;
  --h: 1;
  --hover-opacity-before: 0;
  --hover-opacity-after: .2;
  --object-fit: cover;

  --hover-opacity: var(--hover-opacity-before);
}
.collages__grid{inline-size:100%;block-size:100%;display:grid;grid:1fr 1fr/1fr 1fr;overflow:hidden;border-radius:var(--msc-collages-border-radius);gap:var(--msc-collages-gap);}
.collages__a{position:relative;display:block;overflow:hidden;}
.collages__a::after{position:absolute;inset-inline-start:0;inset-block-start:0;inline-size:100%;block-size:100%;content:'';background:var(--msc-collages-overlay);pointer-events:none;transition:opacity 100ms ease;opacity:var(--hover-opacity);will-change:opacity;z-index:1;}
.collages__a:focus{border:0 none;outline:0 none;}
.collages__a:focus::after{--hover-opacity:var(--hover-opacity-after);}
.collages__img{position:relative;inline-size:100%;block-size:100%;display:block;object-fit:var(--object-fit);}

:host([object-fit=contain]) .collages{--object-fit:contain;}

:host([theme='1']) .collages__grid a:nth-child(1){grid-area:1/1/3/3;}
:host([theme='1']) .collages__grid a:nth-child(n+2){display:none;}

:host([theme='2']) .collages__grid a:nth-child(1){grid-area:1/1/3/2;}
:host([theme='2']) .collages__grid a:nth-child(2){grid-area:1/2/3/3;}
:host([theme='2']) .collages__grid a:nth-child(n+3){display:none;}

:host([theme='3']) .collages__grid a:nth-child(1){grid-area:1/1/2/3;}
:host([theme='3']) .collages__grid a:nth-child(2){grid-area:2/1/3/3;}
:host([theme='3']) .collages__grid a:nth-child(n+3){display:none;}

:host([theme='4']) .collages__grid a:nth-child(1){grid-area:1/1/2/3;}
:host([theme='4']) .collages__grid a:nth-child(n+4){display:none;}

:host([theme='5']) .collages__grid a:nth-child(3){grid-area:2/1/3/3;}
:host([theme='5']) .collages__grid a:nth-child(n+4){display:none;}

:host([theme='6']) .collages__grid a:nth-child(1){grid-area:1/1/3/2;}
:host([theme='6']) .collages__grid a:nth-child(n+4){display:none;}

:host([theme='7']) .collages__grid a:nth-child(2){grid-area:1/2/3/3;}
:host([theme='7']) .collages__grid a:nth-child(n+4){display:none;}

@media (hover: hover) {
  .collages__a:hover::after{--hover-opacity:var(--hover-opacity-after);}
}
</style>

<div class="collages aspect-ratio">
  <div class="content">
    <div class="collages__grid"></div>
  </div>
</div>
`;

const template4Collages = document.createElement('template');
template4Collages.innerHTML = `
{{#collages}}
  <a href="{{link}}" class="collages__a" target="{{target}}" rel="noreferrer noopener" tabindex="0">
    <img class="collages__img" src="{{src}}" alt="{{alt}}" />
  </a>
{{/collages}}
`;

const placeholderCollage = {
  alt: '',
  link: '',
  src: '',
  target: '_blank',
};

// Houdini Props and Vals
if (CSS?.registerProperty) {
  CSS.registerProperty({
    name: '--msc-collages-gap',
    syntax: '<length>',
    inherits: true,
    initialValue: '1px'
  });

  CSS.registerProperty({
    name: '--msc-collages-overlay',
    syntax: '<color>',
    inherits: true,
    initialValue: '#1d2228'
  });

  CSS.registerProperty({
    name: '--msc-collages-border-radius',
    syntax: '<length>',
    inherits: true,
    initialValue: '8px'
  });
}

export class MscCollages extends HTMLElement {
  #data;
  #nodes;
  #config;

  constructor(config) {
    super();

    // template
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // data
    this.#data = {
      controller: ''
    };

    // nodes
    this.#nodes = {
      styleSheet: this.shadowRoot.querySelector('style'),
      grid: this.shadowRoot.querySelector('.collages__grid')
    };

    // config
    this.#config = {
      ...defaults,
      ...config // new MscCollages(config)
    };

    // evts
    this._onCollageClick = this._onCollageClick.bind(this);
  }

  async connectedCallback() {
    const { config, error } = await _wcl.getWCConfig(this);

    if (error) {
      console.warn(`${_wcl.classToTagName(this.constructor.name)}: ${error}`);
      this.remove();
      return;
    } else {
      this.#config = {
        ...this.#config,
        ...config
      };
    }

    // upgradeProperty
    Object.keys(defaults).forEach((key) => this._upgradeProperty(key));

    // evts
    this.#data.controller = new AbortController();
    const signal = this.#data.controller.signal;
    this.#nodes.grid.addEventListener('click', this._onCollageClick, { signal });
  }

  disconnectedCallback() {
    if (this.#data?.controller) {
      this.#data.controller.abort();
    }
  }

  _format(attrName, oldValue, newValue) {
    const hasValue = newValue !== null;

    if (!hasValue) {
      this.#config[attrName] = defaults[attrName];
    } else {
      switch (attrName) {
        case 'collages':
          try {
            const collages = JSON.parse(newValue).reduce(
              (acc, cur) => {
                const collage = {
                  ...placeholderCollage,
                  ...cur
                };

                acc.push(collage);

                return acc;
              }
            , [])
            .filter(({ link, src }) => link && src)
            .slice(0, 4);

            this.#config[attrName] = collages;
          } catch(err) {
            console.warn(`${_wcl.classToTagName(this.constructor.name)}: ${err.message}`);
          }
          break;
        case 'object-fit':
          this.#config[attrName] = ['cover', 'contain'].includes(newValue) ? newValue : defaults[attrName];
          break;
        case 'theme': {
          const id = +newValue;
          this.#config[attrName] = (isNaN(id) || id <= 0 || id > 8) ? defaults.theme : id;
          break;
        }
      }
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (!MscCollages.observedAttributes.includes(attrName)) {
      return;
    }

    this._format(attrName, oldValue, newValue);

    switch (attrName) {
      case 'collages':
        this._genCollages();
        break;
      case 'theme':
        break;
      case 'object-fit':
        break;
    }
  }

  static get observedAttributes() {
    return Object.keys(defaults); // MscCollages.observedAttributes
  }

  _upgradeProperty(prop) {
    let value;

    if (MscCollages.observedAttributes.includes(prop)) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        value = this[prop];
        delete this[prop];
      } else {
        if (this.hasAttribute(prop)) {
          value = this.getAttribute(prop);
        } else {
          value = objectAttrs.includes(prop) ? JSON.stringify(this.#config[prop]) : this.#config[prop];
        }
      }

      this[prop] = value;
    }
  }

  set theme(value) {
    if (value) {
      this.setAttribute('theme', value);
    } else {
      this.removeAttribute('theme');
    }
  }

  get theme() {
    return this.#config.theme;
  }

  set ['object-fit'](value) {
    if (value) {
      this.setAttribute('object-fit', value);
    } else {
      this.removeAttribute('object-fit');
    }
  }

  get ['object-fit']() {
    return this.#config['object-fit'];
  }

  set collages(value) {
    if (value) {
      const newValue = [
        ...(typeof value === 'string' ? JSON.parse(value) : value)
      ];
      this.setAttribute('collages', JSON.stringify(newValue));
    } else {
      this.removeAttribute('collages');
    }
  }

  get collages() {
    return this.#config.collages;
  }

  _fireEvent(evtName, detail) {
    this.dispatchEvent(new CustomEvent(evtName,
      {
        bubbles: true,
        composed: true,
        ...(detail && { detail })
      }
    ));
  }

  _genCollages() {
    const { grid } = this.#nodes;

    _wcl.removeAllChildNodes(grid);

    const collagesString = Mustache.render(template4Collages.innerHTML, { collages:this.collages });
    grid.insertAdjacentHTML('beforeend', collagesString);
  }

  _onCollageClick(evt) {
    const a = evt.target.closest('a');
    const idx = Array.from(this.#nodes.grid.querySelectorAll('a')).indexOf(a);
    const detail = {
      baseEvent: evt, // original click event
      ...this.collages[idx]
    };

    this._fireEvent(custumEvents.click, detail);
  }
}

// define web component
const S = _wcl.supports();
const T = _wcl.classToTagName('MscCollages');
if (S.customElements && S.shadowDOM && S.template && !window.customElements.get(T)) {
  window.customElements.define(T, MscCollages);
}