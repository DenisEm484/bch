const mediaQuerySizeL = window.matchMedia("(max-width: 1199px)");

class FocusTrap {
  static focusableSelectors = ["a[href]", "input", "button", "select", "textarea", "[tabindex]"];

  constructor(container) {
    this.container = container;
  }

  focusCatch(e) {
    if (e.key != "Tab") return;
    const focusableArray = Array.prototype.slice.call(this.focusable);
    const focusedIndex = focusableArray.indexOf(document.activeElement);

    if (e.shiftKey && focusedIndex === 0) {
      focusableArray[focusableArray.length - 1].focus();
      e.preventDefault();
    }
    if (!e.shiftKey && focusedIndex === focusableArray.length - 1) {
      focusableArray[0].focus();
      e.preventDefault();
    }
  }

  enable() {
    this.prevActiveElement = document.activeElement;
    this.eventHandler = this.focusCatch.bind(this);
    this.focusable = this.container.querySelectorAll(FocusTrap.focusableSelectors);

    if (this.focusable) {
      this.focusable[0].focus();
      window.addEventListener("keydown", this.eventHandler);
    }
    return this
  }

  disable() {
    this.prevActiveElement.focus();
    this.prevActiveElement = null;
    window.removeEventListener("keydown", this.eventHandler);
  }
}

const pageScroll = {
  html: document.querySelector("html"),
  body: document.body,
  fixedElements: document.querySelectorAll(".fixed"),

  disable: function () {
    const pagePositionY = window.scrollY;
    const offset = window.innerWidth - this.body.offsetWidth + "px";

    this.fixedElements.forEach((block) => {
      block.style.paddingRight = offset;
    });
    this.body.style.paddingRight = offset;

    this.body.dataset.positionY = pagePositionY;
    this.body.classList.add("disable-scroll");
    this.body.style.top = -pagePositionY + "px";
  },

  enable: function () {
    const pagePositionY = parseInt(this.body.dataset.positionY, 10);

    this.fixedElements.forEach((block) => {
      block.style.paddingRight = "0";
    });
    this.body.style.paddingRight = "0"

    this.body.style.top = "auto";
    this.body.classList.remove("disable-scroll");
    this.body.removeAttribute("data-positionY");

    this.html.style.scrollBehavior = "auto"
    window.scroll({ top: pagePositionY, left: 0 });
    this.html.style.scrollBehavior = "";
  }
}

const setInteractive = (container, interactivity = true) => {
  const focusable = container.parentNode.querySelectorAll(FocusTrap.focusableSelectors);
  const focusableArray = Array.prototype.slice.call(focusable);
  const containerFocusable = focusableArray.filter((el) => container.contains(el));

  containerFocusable.forEach((el) => el.tabIndex = interactivity ? "" : "-1");
  container.setAttribute("aria-hidden", !interactivity);
}

const searchForm = {
  formCls: "search-form",
  openBtnCls: "search-open",
  closeBtnCls: "search-close",

  activeCls: "active",
  disabledCls: "disabled",

  cleanUp: function () {
    this.form.classList.remove(this.activeCls, this.disabledCls);
    this.openBtn.classList.remove(this.disabledCls);
  },

  moveIn: function (selector) {
    if (this.isActive) this.cleanUp();
    this.form.parentNode.removeChild(this.form);
    document.querySelector(selector).append(this.form);
  },

  getAnimationTime: function () {
    return parseFloat(
      window.getComputedStyle(this.form, null).getPropertyValue("--animation-time").slice(0, 4)
    ) * 1000;
  },

  open: function () {
    this.form.classList.add(this.activeCls);
    this.openBtn.classList.add(this.disabledCls);
    this.isActive = true;
  },

  close: function () {
    this.form.classList.add(this.disabledCls);
    this.form.querySelector("input").value = "";
    this.isActive = false;
  },

  init: function () {
    this.form = document.querySelector(`.${this.formCls}`);
    this.openBtn = document.querySelector(`.${this.openBtnCls}`);
    this.closeBtn = document.querySelector(`.${this.closeBtnCls}`);

    this.form.addEventListener("animationend", () => {
      if (this.form.classList.contains(this.disabledCls)) this.cleanUp();
    });
    this.openBtn.addEventListener("click", this.open.bind(this));
    this.closeBtn.addEventListener("click", this.close.bind(this));

    document.addEventListener("click", (e) => {
      if (!this.isActive || e.target.closest(`.${this.openBtnCls}`)) return;
      if (!e.composedPath().includes(this.form)) this.close(e);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key == "Escape" && this.isActive) this.close();
    });
  }
}

const mainMenu = {
  menuCls: "main-menu",
  contentCls: "main-menu-content",
  openBtnCls: "burger",
  closeBtnCls: "menu-close",

  activeCls: "active",
  disabledCls: "disabled",

  recalculate: function () {
    const container = document.querySelector(".container");
    const containerPadding = parseInt(
      window.getComputedStyle(container, null).getPropertyValue("padding-left").slice(0, -2)
    );
    const leftOffset = container.offsetLeft + containerPadding;

    this.menu.style.paddingLeft = `${leftOffset}px`;
    if (this.simpleBar) this.simpleBar.recalculate();
  },

  handleLinkClick: function (e) {
    e.preventDefault();
    this.choice = e.currentTarget;
    this.close();
  },

  cleanUp: function () {
    this.menu.classList.remove(this.activeCls, this.disabledCls);
    this.openBtn.classList.remove(this.disabledCls);

    this.focusTrap.disable();
    pageScroll.enable();

    if (this.choice) {
      window.location.href = this.choice.getAttribute("href");
    }
    this.choice = null;
  },

  activate: function () {
    this.simpleBar = new SimpleBar(this.menu);
    this.menu.addEventListener("animationend", this.cleanHandler);
    this.links.forEach((link) => {
      link.addEventListener("click", this.linkHandler, false);
    });
  },

  deactivate: function () {
    this.simpleBar = null;

    this.menu.removeAttribute("data-simplebar");
    this.menu.removeAttribute("style");
    this.menu.replaceChildren();
    this.menu.append(this.content);
    this.menu.removeEventListener("animationend", this.cleanHandler);

    this.links.forEach((link) => {
      link.removeEventListener("click", this.linkHandler);
    });

    if (this.isActive) this.cleanUp();
  },

  open: function () {
    this.focusTrap = new FocusTrap(this.menu).enable();
    pageScroll.disable();

    this.openBtn.classList.add(this.disabledCls);
    this.menu.classList.add(this.activeCls);
    this.isActive = true;
  },

  close: function () {
    this.menu.classList.add(this.disabledCls);
    this.isActive = false;
  },

  init: function () {
    this.menu = document.querySelector(`.${this.menuCls}`);
    this.content = document.querySelector(`.${this.contentCls}`);
    this.openBtn = document.querySelector(`.${this.openBtnCls}`);
    this.closeBtn = document.querySelector(`.${this.closeBtnCls}`);
    this.links = document.querySelectorAll(`.${this.menuCls} a`);

    this.cleanHandler = () => {
      if (this.menu.classList.contains(this.disabledCls)) this.cleanUp();
    }
    this.linkHandler = this.handleLinkClick.bind(this);

    this.openBtn.addEventListener("click", () => {
      if (searchForm.isActive) {
        setTimeout(() => { this.open() }, searchForm.getAnimationTime());
        return;
      }
      this.open();
    });
    this.closeBtn.addEventListener("click", this.close.bind(this));

    document.addEventListener("keydown", (e) => {
      if (e.key == "Escape" && this.isActive) this.close();
    });
  }
}

const dropdownMenu = {
  menuCls: "artists-menu",
  btnCls: "btn-dropdown",
  activeCls: "active",
  disabledCls: "disabled",

  handleLinkClick: function (e) {
    e.preventDefault();
    this.choice = e.currentTarget;
    this.close();
  },

  cleanUp: function (e) {
    const dropdown = e.currentTarget;
    if (!dropdown.classList.contains(this.disabledCls)) return;

    dropdown.classList.remove(this.activeCls, this.disabledCls);
    dropdown.removeEventListener("animationend", this.cleanHandler);

    if (this.choice) {
      window.location.href = this.choice.getAttribute("href");
    }
    this.choice = null;
  },

  close: function () {
    const btn = this.container.firstElementChild;
    const dropdown = this.container.lastElementChild;
    this.container = null;

    btn.classList.remove(this.activeCls);
    btn.setAttribute("aria-expanded", "false");

    dropdown.classList.add(this.disabledCls);
  },

  open: function (e) {
    this.container = e.currentTarget.parentNode;
    this.cleanHandler = this.cleanUp.bind(this);

    e.currentTarget.classList.add(this.activeCls);
    e.currentTarget.setAttribute("aria-expanded", "true");

    const dropdown = this.container.lastElementChild;
    dropdown.classList.add(this.activeCls);
    dropdown.addEventListener("animationend", this.cleanHandler);
  },

  init: function () {
    document.querySelectorAll(`.${this.menuCls} a`).forEach((link) => {
      link.addEventListener("click", this.handleLinkClick.bind(this));
    });

    document.querySelectorAll(`.${this.btnCls}`).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (!this.container) {
          this.open(e);
          return;
        }
        const prevBtn = this.container.firstElementChild;
        this.close();
        if (e.currentTarget != prevBtn) this.open(e);
      });
    });

    document.addEventListener("click", (e) => {
      if (!this.container || e.target.closest(`.${this.btnCls}`)) return;
      if (!e.composedPath().includes(this.container)) this.close();
    });

    document.addEventListener("keydown", (e) => {
      if (this.container && e.key == "Escape") this.close();
    });
  }
}

const header = {
  accountLinkCls: {
    main: "account-link",
    extra: ["btn", "btn_transparent", "account-link_large"]
  },

  reshape: function (e) {
    this.prevMatchSizeL = this.currMatchSizeL;
    this.currMatchSizeL = e.matches;

    if (this.currMatchSizeL) {
      searchForm.moveIn(".search-wrapper");
      this.accountLink.classList.add(...this.accountLinkCls.extra);
      mainMenu.activate();
      mainMenu.recalculate();

    } else if (this.prevMatchSizeL) {
      searchForm.moveIn(".header-bottom-wrapper");
      this.accountLink.classList.remove(...this.accountLinkCls.extra);
      mainMenu.deactivate();
    }
  },

  init: function () {
    this.currMatchSizeL = mediaQuerySizeL.matches;
    this.prevMatchSizeL = this.currMatchSizeL;
    this.accountLink = document.querySelector(`.${this.accountLinkCls.main}`);

    searchForm.init();
    mainMenu.init();
    dropdownMenu.init();

    mediaQuerySizeL.addEventListener("change", this.reshape.bind(this));
    this.reshape(mediaQuerySizeL);

    window.addEventListener("resize", () => {
      if (this.currMatchSizeL) {
        setTimeout(() => { mainMenu.recalculate() }, 100);
      }
    });
  }
}

header.init();

const galleryChoices = new Choices(document.querySelector(".select"), {
  position: "bottom",
  searchEnabled: false,
  itemSelectText: "",
  classNames: {
    containerOuter: 'choices gallery__select',
  }
});

const galleryModal = {
  overlayCls: "gallery-overlay",
  openBtnCls: "picture-open",
  closeBtnCls: "picture-close",

  activeCls: "active",
  disabledCls: "disabled",

  open: function (e) {
    pageScroll.disable();

    const path = e.currentTarget.getAttribute("data-path");
    this.modal = this.overlay.querySelector(`[data-target="${path}"]`);

    this.modal.classList.add(this.activeCls);
    this.overlay.classList.add(this.activeCls);
  },

  close: function () {
    this.overlay.classList.add(this.disabledCls);
  },

  init: function () {
    this.overlay = document.querySelector(`.${this.overlayCls}`)
    this.overlay.addEventListener("animationend", () => {
      if (!this.overlay.classList.contains(this.disabledCls)) {
        this.focusTrap = new FocusTrap(this.modal).enable();
        return;
      }

      this.overlay.classList.remove(this.activeCls);
      this.overlay.classList.remove(this.disabledCls);
      this.modal.classList.remove(this.activeCls);
      this.modal = null;

      this.focusTrap.disable();
      pageScroll.enable();
    });

    document.querySelectorAll(`.${this.openBtnCls}`).forEach((btn) => {
      btn.addEventListener("click", this.open.bind(this))
    });
    document.querySelectorAll(`.${this.closeBtnCls}`).forEach((btn) => {
      btn.addEventListener("click", this.close.bind(this))
    });
    document.addEventListener("click", (e) => {
      if (!this.modal || e.target.closest(`.${this.openBtnCls}`)) return;
      if (!e.composedPath().includes(this.modal)) this.close();
    });
    document.addEventListener("keydown", (e) => {
      if (this.modal && e.key == "Escape") this.close();
    });
  }
}

galleryModal.init();

const catalogTab = {
  tabCls: "tab-wrapper",
  btnCls: "tab-btn",
  targetCls: "tab-target",
  activeCls: "active",

  init: function () {
    this.container = document.querySelector(`.${this.tabCls}`);
    document.querySelectorAll(`.${this.btnCls}`).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (e.currentTarget.classList.contains(this.activeCls)) return;

        const path = e.currentTarget.dataset.path;
        const target = this.container.querySelector(`.${this.targetCls}[data-target="${path}"]`);
        document.querySelectorAll(`.${this.targetCls}`).forEach((target) => {
          target.classList.remove(this.activeCls);
        });
        target.classList.add(this.activeCls);

        window.scrollBy({
          top: target.getBoundingClientRect().top - 15,
          behavior: "smooth"
        });

        document.querySelectorAll(`.${this.btnCls}`).forEach((btn) => {
          btn.classList.remove(this.activeCls);
          btn.setAttribute("aria-selected", "false");
        });
        e.currentTarget.classList.add(this.activeCls);
        e.currentTarget.setAttribute("aria-selected", "true");
      });
    });
  }
}

catalogTab.init();

const catalogAcc = {
  accordionCls: "catalog-acc",
  contentCls: "acc-content",

  init: function () {
    this.accordion = new Accordion(`.${this.accordionCls}`, {
      duration: 300,
      openOnInit: [],
      elementClass: "acc-element",
      triggerClass: "acc-trigger",
      panelClass: "acc-panel",
      activeClass: "active",

      onOpen: (element) => {
        const content = element.querySelector(`.${this.contentCls}`);
        setInteractive(content);
      },

      onClose: (element) => {
        const content = element.querySelector(`.${this.contentCls}`);
        setInteractive(content, false);
      }
    });

    document.querySelectorAll(`.${this.contentCls}`).forEach((content) => {
      setInteractive(content, false)
    });

    this.accordion.open(0);
  }
};

catalogAcc.init();

tippy.setDefaultProps({
  duration: 300,
  maxWidth: 265,
  offset: [0, 10],
  theme: "amethyst",
  trigger: "click focusin"
});

document.querySelectorAll(".tooltip-marker").forEach(marker => {
  tippy(marker, {
    content(reference) {
      const id = reference.getAttribute("data-template");
      const template = document.getElementById(id);
      return template.innerHTML;
    },

    allowHTML: true,

    onShow(instance) {
      instance.setProps({ trigger: 'mouseenter focusin click' });
      marker.classList.add("active");
    },

    onHide(instance) {
      instance.setProps({ trigger: 'click focusin' });
      marker.classList.remove("active");
    }
  });
});

const topSwiper = new Swiper(".top-swiper", {
  allowTouchMove: false,
  loop: true,
  effect: "fade",
  speed: 5000,
  autoplay: {
    delay: 3000
  },
  a11y: false,
});

class SwiperBuilder {
  static defaultParams = {
    grid: {
      rows: 1,
      fill: "row"
    },
    slidesPerView: 1,
    spaceBetween: 20,
    keyboard: {
      enabled: true,
      onlyInViewport: true
    },
    watchSlidesProgress: true,
    slideVisibleClass: "slide-visible",
    on: {
      init: function () {
        this.slides.forEach((slide) => {
          if (slide.classList.contains("slide-visible")) {
            setInteractive(slide);
          } else {
            setInteractive(slide, false);
          }
        });
      },
      slideChange: function () {
        this.slides.forEach((slide) => {
          if (slide.classList.contains("slide-visible")) {
            setInteractive(slide);
          } else {
            setInteractive(slide, false);
          }
        });
      }
    }
  }

  constructor(selector) {
    this.selector = selector;
  }

  params(newParams = {}) {
    this.params = Object.assign({}, SwiperBuilder.defaultParams);
    Object.assign(this.params, newParams);
    return this;
  }

  build() {
    return new Swiper(this.selector, this.params);
  }
}

const gallerySwiper = new SwiperBuilder(".gallery-swiper").params({
  breakpoints: {
    576: {
      slidesPerView: 2,
      slidesPerGroup: 2,
      spaceBetween: 38
    },
    992: {
      slidesPerView: 2,
      slidesPerGroup: 2,
      spaceBetween: 34,
    },
    1200: {
      slidesPerView: 3,
      slidesPerGroup: 3,
      spaceBetween: 50,
    }
  },
  pagination: {
    el: ".gallery-pag",
    type: "fraction"
  },
  navigation: {
    nextEl: ".gallery-next",
    prevEl: ".gallery-prev"
  },
  a11y: {
    containerMessage: "Слайды галереи",
    nextSlideMessage: "Следующий слайд",
    prevSlideMessage: "Предыдущий слайд",
    slideLabelMessage: "Слайд {{index}} из {{slidesLength}}",
    slideRole: "button"
  },
}).build();

const eventsSwiper = new SwiperBuilder(".events-swiper").params({
  breakpoints: {
    576: {
      slidesPerView: 2,
      slidesPerGroup: 2,
      spaceBetween: 34,
    },
    992: {
      slidesPerView: 3,
      slidesPerGroup: 3,
      spaceBetween: 27,
    },
    1200: {
      slidesPerView: 3,
      slidesPerGroup: 3,
      spaceBetween: 50,
    }
  },
  navigation: {
    nextEl: ".events-next",
    prevEl: ".events-prev"
  },
  pagination: {
    el: ".events-pag",
    type: "bullets",
    bulletClass: "events-pagination-bullet",
    bulletActiveClass: "events-pagination-bullet-active"
  },
  a11y: {
    containerMessage: "Слайды событий",
    nextSlideMessage: "Следующий слайд",
    prevSlideMessage: "Предыдущий слайд",
    slideLabelMessage: "Слайд {{index}} из {{slidesLength}}"
  }
}).build();

const projectsSwiper = new SwiperBuilder(".projects-swiper").params({
  breakpoints: {
    576: {
      slidesPerView: 2,
      spaceBetween: 34,
      slidesPerGroup: 2
    },
    992: {
      slidesPerView: 2,
      spaceBetween: 50,
      slidesPerGroup: 2
    },
    1200: {
      slidesPerView: 3,
      spaceBetween: 50,
      slidesPerGroup: 3
    }
  },
  navigation: {
    nextEl: ".projects-next",
    prevEl: ".projects-prev"
  },
  a11y: {
    containerMessage: "Слайды партнеров",
    nextSlideMessage: "Следующий слайд",
    prevSlideMessage: "Предыдущий слайд",
    slideLabelMessage: "Слайд {{index}} из {{slidesLength}}"
  }
}).build();

const callbackForm = {
  formCls: "callback-form",
  modalCls: "callback-modal",

  activeCls: "active",
  disabledCls: "disabled",

  init: function () {
    this.modal = document.querySelector(`.${this.modalCls}`);
    this.validator = new window.JustValidate(`.${this.formCls}`, {
      errorLabelStyle: { color: "#D11616" }
    });
    this.phone = document.querySelector("input[type='tel']");

    this.modal.addEventListener("animationend", (e) => {
      if (e.target.classList.contains(this.disabledCls)) {
        e.target.classList.remove(this.activeCls, this.disabledCls);
      }
    });

    Inputmask("+7 (999) 999-99-99").mask(this.phone);

    this.validator
      .addField(".name", [{
        rule: "required",
        errorMessage: "Не введено имя"
      },
      {
        rule: "minLength",
        value: 3,
        errorMessage: "Минимальная длинна 3 символа"
      },
      {
        rule: "maxLength",
        value: 40,
        errorMessage: "Максимальная длинна 40 символов"
      }
      ])
      .addField(".phone", [{
        rule: "required",
        errorMessage: "Не введен номер телефона"
      },
      {
        validator: (value, context) => {
          const number = this.phone.inputmask.unmaskedvalue();
          return number.length === 10;
        },
        errorMessage: "Не корректный номер",
      }
      ]).onSuccess((e) => {
        const formData = new FormData(e.target);
        const xhr = new XMLHttpRequest();
        const messages = {
          ok: {
            text: "Заявка отправлена",
            color: "#30BF39"
          },
          nok: {
            text: "Неудачная попытка!<br>Попробуйте позже",
            color: "#D11616"
          }
        }

        const notify = (message) => {
          this.modal.firstElementChild.style.color = message.color;
          this.modal.firstElementChild.innerHTML = message.text;
          this.modal.classList.add("active");
          setTimeout(() => { this.modal.classList.add(this.disabledCls) }, 3000);
        }

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            const message = xhr.status === 200 ? messages.ok : messages.nok;
            notify(message);
          }
        }
        xhr.open("POST", "mail.php", true);
        xhr.send(formData);

        e.target.reset();
      });
  }
}

callbackForm.init();

const mapInit = () => {
  const contactsMap = new ymaps.Map(
    "contacts-map",
    {
      center: [55.75846806898367, 37.60108849999989],
      zoom: 14,
      controls: ["geolocationControl", "zoomControl"]
    },
    {
      suppressMapOpenBlock: true,
      zoomControlSize: "small",
      zoomControlFloat: "none",
      zoomControlPosition: { top: "270px", right: "10px" },
      geolocationControlSize: "large",
      geolocationControlFloat: "none",
      geolocationControlPosition: { top: "360px", right: "10px" }
    }
  );

  if (mediaQuerySizeL.matches) {
    if (Object.keys(contactsMap.controls._controlKeys).length) {
      contactsMap.controls.remove("zoomControl");
      contactsMap.controls.remove("geolocationControl");
    }
  }

  contactsMap.behaviors.disable("scrollZoom");

  contactsMap.events.add("sizechange", function (e) {
    if (mediaQuerySizeL.matches) {
      if (Object.keys(contactsMap.controls._controlKeys).length) {
        contactsMap.controls.remove("zoomControl");
        contactsMap.controls.remove("geolocationControl");
      }
    } else {
      if (!Object.keys(contactsMap.controls._controlKeys).length) {
        contactsMap.controls.add("zoomControl");
        contactsMap.controls.add("geolocationControl");
      }
    }
  });

  const myPlacemark = new ymaps.Placemark(
    [55.75846806898367, 37.60108849999989],
    {},
    {
      iconLayout: "default#image",
      iconImageHref: "../img/icons/placemark.svg",
      iconImageSize: [20, 20],
    }
  );

  contactsMap.geoObjects.add(myPlacemark);
  contactsMap.container.fitToViewport();
}

ymaps.ready(mapInit);
