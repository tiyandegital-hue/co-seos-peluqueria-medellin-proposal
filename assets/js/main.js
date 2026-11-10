/* SEOS Peluquería — shared interactions.
   Business name as ONE swappable constant. All CTAs -> https://wa.me/573128072680 */
(function () {
  "use strict";
  var BUSINESS_NAME = "SEOS Peluquería";
  var WA_NUMBER = "573128072680";
  var WA_BASE = "https://wa.me/" + WA_NUMBER;
  window.SEOS = { name: BUSINESS_NAME, wa: WA_BASE };
  function waLink(msg) { return WA_BASE + (msg ? "?text=" + encodeURIComponent(msg) : ""); }

  /* Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Before / after sliders (pointer drag, default 50%) */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var pos = 50;
    function setPos(clientX) {
      var r = ba.getBoundingClientRect();
      pos = Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100));
      ba.style.setProperty("--pos", pos + "%");
    }
    ba.style.setProperty("--pos", "50%");
    ba.addEventListener("pointerdown", function (e) {
      ba.setPointerCapture(e.pointerId);
      setPos(e.clientX);
      function move(ev) { setPos(ev.clientX); }
      function up() {
        ba.removeEventListener("pointermove", move);
        ba.removeEventListener("pointerup", up);
      }
      ba.addEventListener("pointermove", move);
      ba.addEventListener("pointerup", up);
    });
    ba.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { pos = Math.max(4, pos - 5); ba.style.setProperty("--pos", pos + "%"); e.preventDefault(); }
      if (e.key === "ArrowRight") { pos = Math.min(96, pos + 5); ba.style.setProperty("--pos", pos + "%"); e.preventDefault(); }
    });
  });

  /* Single-select filter groups (Servicios, Galería) */
  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var scope = document.querySelector(group.getAttribute("data-filter-group"));
    if (!scope) return;
    group.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      group.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var f = btn.getAttribute("data-filter");
      var count = 0;
      scope.querySelectorAll("[data-cat]").forEach(function (card) {
        var show = f === "all" || card.getAttribute("data-cat") === f;
        card.classList.toggle("hidden-card", !show);
        if (show) count++;
      });
      var counter = document.querySelector("[data-filter-count]");
      if (counter) counter.textContent = "Mostrando " + count + (count === 1 ? " expediente" : " expedientes");
    });
  });

  /* Color technique tabs */
  document.querySelectorAll("[data-tabs]").forEach(function (tabs) {
    tabs.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tab]");
      if (!btn) return;
      tabs.querySelectorAll("[data-tab]").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var id = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.toggle("active", p.id === id);
      });
    });
  });

  /* FAQ accordions */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      var wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
      if (!wasOpen) item.classList.add("open");
      q.setAttribute("aria-expanded", wasOpen ? "false" : "true");
    });
  });

  /* ---------- Reserva wizard ---------- */
  var wizard = document.querySelector("[data-reserva]");
  if (wizard) {
    var SERVICES = {
      "balayage": { name: "Balayage R6M Couture", dur: "3.5 a 5.0 horas" },
      "mechas": { name: "Mechas & Babylights", dur: "3.0 a 4.5 horas" },
      "color": { name: "Color Global & Retoque", dur: "2.0 a 3.5 horas" },
      "tratamiento": { name: "Tratamiento Reparador", dur: "1.5 a 2.0 horas" },
      "corte": { name: "Corte Editorial & Styling", dur: "1.0 a 1.5 horas" },
      "cejas": { name: "Diseño & Perfilado de Cejas", dur: "40 a 50 minutos" }
    };
    var state = { service: "balayage", dayKey: null, dayLabel: "", time: "", length: "Medio (Hasta el busto)" };
    var dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    var monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    var dayGrid = document.getElementById("dayGrid");
    var slotGrid = document.getElementById("slotGrid");
    var days = [];
    (function buildDays() {
      var today = new Date();
      for (var i = 0; i < 14; i++) {
        var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        var dow = d.getDay();
        var label = dayNames[dow] + " " + d.getDate() + " de " + monthNames[d.getMonth()];
        var bookable = dow !== 0;
        var hours = dow === 6 ? "10:00 – 17:00" : "11:00 – 19:00";
        days.push({ date: d, dow: dow, label: label, bookable: bookable, hours: hours });
      }
      days.forEach(function (day, idx) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "day" + (day.bookable ? "" : " disabled");
        b.setAttribute("data-day", idx);
        b.innerHTML = "<b>" + dayNames[day.dow].slice(0, 3) + "</b><span>" + day.date.getDate() + " " +
          monthNames[day.date.getMonth()].slice(0, 3) + "</span><small>" +
          (day.bookable ? day.hours : "A confirmar") + "</small>";
        if (day.bookable) b.addEventListener("click", function () { selectDay(idx); });
        dayGrid.appendChild(b);
      });
      /* Default day: next Saturday (matches the export's live-summary default) */
      var sat = days.findIndex(function (d) { return d.dow === 6; });
      selectDay(sat >= 0 ? sat : 0, true);
    })();

    function slotsFor(dow) {
      var start = dow === 6 ? 10 : 11, end = dow === 6 ? 17 : 19, out = [];
      for (var h = start; h < end; h++) out.push(String(h).padStart(2, "0") + ":00");
      return out;
    }
    function franjaFor(time) {
      var h = parseInt(time, 10);
      if (h < 13) return "Jornada Mañana";
      if (h < 16) return "Jornada Tarde";
      return "Jornada Última hora";
    }
    function selectDay(idx, silent) {
      var day = days[idx];
      if (!day || !day.bookable) return;
      state.dayKey = idx; state.dayLabel = day.label + " (" + day.hours + ")";
      dayGrid.querySelectorAll(".day").forEach(function (el) {
        el.classList.toggle("selected", parseInt(el.getAttribute("data-day"), 10) === idx);
      });
      slotGrid.innerHTML = "";
      slotsFor(day.dow).forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "slot"; b.textContent = t;
        b.addEventListener("click", function () {
          slotGrid.querySelectorAll(".slot").forEach(function (s) { s.classList.remove("selected"); });
          b.classList.add("selected");
          state.time = t; updateSummary(); renderReview();
        });
        slotGrid.appendChild(b);
      });
      /* Default slot: first slot of the day (morning) */
      var first = slotGrid.querySelector(".slot");
      if (first) { first.classList.add("selected"); state.time = first.textContent; }
      if (!silent) { updateSummary(); renderReview(); }
      updateSummary(); renderReview();
    }

    function updateSummary() {
      var s = SERVICES[state.service];
      var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
      set("sumService", s.name);
      set("sumDay", state.dayLabel || "Sábado (10:00 – 17:00)");
      set("sumFranja", state.time ? franjaFor(state.time) : "Jornada Mañana");
      set("sumLength", state.length);
      set("sumTime", state.time || "—");
    }

    /* Service cards */
    wizard.querySelectorAll("[data-service]").forEach(function (card) {
      card.addEventListener("click", function () {
        wizard.querySelectorAll("[data-service]").forEach(function (c) { c.classList.remove("selected"); });
        card.classList.add("selected");
        state.service = card.getAttribute("data-service");
        updateSummary(); renderReview();
      });
    });

    /* Length selector */
    document.querySelectorAll("[data-length]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-length]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.length = btn.getAttribute("data-length");
        updateSummary(); renderReview();
      });
    });

    /* Step navigation */
    var panes = wizard.querySelectorAll(".step-pane");
    var steppers = document.querySelectorAll(".stepper .st");
    function goStep(n) {
      panes.forEach(function (p, i) { p.classList.toggle("active", i === n - 1); });
      steppers.forEach(function (s, i) {
        s.classList.toggle("on", i === n - 1);
        s.classList.toggle("done", i < n - 1);
      });
      wizard.scrollIntoView({ behavior: "smooth", block: "start" });
      if (n === 3) renderReview();
    }
    wizard.querySelectorAll("[data-goto]").forEach(function (btn) {
      btn.addEventListener("click", function () { goStep(parseInt(btn.getAttribute("data-goto"), 10)); });
    });

    function renderReview() {
      var s = SERVICES[state.service];
      var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
      set("revService", s.name + " · " + s.dur);
      set("revDay", state.dayLabel);
      set("revTime", state.time ? state.time + " · " + franjaFor(state.time) : "—");
      set("revLength", state.length);
      var msg = "Hola " + BUSINESS_NAME + ", quiero reservar " + s.name + " el " + state.dayLabel +
        " a las " + (state.time || "[hora por confirmar]") + ". Longitud: " + state.length +
        ". ¿Me confirman disponibilidad?";
      var confirmBtn = document.getElementById("confirmWa");
      if (confirmBtn) confirmBtn.href = waLink(msg);
      var preview = document.getElementById("msgPreview");
      if (preview) preview.textContent = "«" + msg + "»";
    }
    updateSummary(); renderReview();
  }

  /* ---------- Forms: validate + open WhatsApp with compiled message ---------- */
  document.querySelectorAll("[data-wa-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var field = f.closest(".field") || f.parentElement;
        var bad = !f.value || !String(f.value).trim();
        if (f.type === "checkbox" && !f.checked) bad = true;
        if (field) field.classList.toggle("invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      var lines = [];
      form.querySelectorAll("[data-msg]").forEach(function (f) {
        var label = f.getAttribute("data-msg");
        var val = "";
        if (f.type === "checkbox") { if (f.checked) val = "Sí"; else return; }
        else val = String(f.value).trim();
        if (val) lines.push(label + ": " + val);
      });
      var intro = form.getAttribute("data-intro") || ("Hola " + BUSINESS_NAME + ",");
      var msg = intro + "\n" + lines.join("\n");
      window.open(waLink(msg), "_blank", "noopener");
    });
    /* clear invalid state as the user types */
    form.querySelectorAll("[required]").forEach(function (f) {
      f.addEventListener("input", function () {
        var field = f.closest(".field");
        if (field) field.classList.remove("invalid");
      });
    });
  });
})();
