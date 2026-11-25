/* Python Academy — tiny SPA, no build step.
 * Routes:  #/                 home
 *          #/<track>/<step>   a step (1-based)
 * Python runs in the browser through Pyodide (CPython compiled to WebAssembly),
 * loaded lazily the first time you press Run. */
(() => {
  "use strict";

  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  const TRACKS = window.TRACKS;
  const $ = (sel, root = document) => root.querySelector(sel);

  // ---------------------------------------------------------------- storage
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  };
  const done = new Set(store.get("pyacademy.done", []));
  const markDone = (key) => { done.add(key); store.set("pyacademy.done", [...done]); };
  const trackProgress = (t) => t.steps.filter((_, i) => done.has(`${t.id}/${i + 1}`)).length;

  // ---------------------------------------------------------------- theme
  const prefersLight = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches;
  const setTheme = (t) => {
    document.documentElement.dataset.theme = t;
    $("#theme-toggle").textContent = t === "light" ? "☾" : "☀";
    store.set("pyacademy.theme", t);
  };
  setTheme(store.get("pyacademy.theme", prefersLight ? "light" : "dark"));
  $("#theme-toggle").addEventListener("click", () =>
    setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"));

  // ---------------------------------------------------------------- highlighter
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const PY_KW = new Set(("and as assert async await break class continue def del elif else except finally for from " +
    "global if import in is lambda nonlocal not or pass raise return try while with yield match case True False None").split(" "));
  const PY_BI = new Set(("print len range list dict set tuple str int float bool sum min max sorted enumerate zip map " +
    "filter isinstance type super open any all object self cls repr round iter next frozenset Exception ValueError TypeError").split(" "));
  const C_KW = new Set(("public private protected static final class interface record extends implements new return " +
    "void int double long boolean String var if else for foreach while try catch finally throw throws using async await " +
    "this null true false import package SELECT FROM WHERE JOIN LEFT ON GROUP BY AS AND IS NOT NULL DISTINCT INSERT INTO " +
    "VALUES CREATE TABLE FROM CMD COPY RUN WORKDIR in select where").split(" "));

  function highlight(code, lang) {
    const py = lang === "python";
    const re = py
      ? /(#.*)|([rRfFbBuU]{0,2}"""[\s\S]*?"""|[rRfFbBuU]{0,2}'''[\s\S]*?'''|[rRfFbBuU]{0,2}"(?:\\.|[^"\\\n])*"|[rRfFbBuU]{0,2}'(?:\\.|[^'\\\n])*')|(@[\w.]+)|(\b\d[\d_]*(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g
      : /(\/\/.*|--\s.*|#\s.*|<!--[\s\S]*?-->)|(\$?"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(@\w+)|(\b\d[\d_]*(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;
    let out = "", last = 0, prevWord = "", m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const [tok, com, str, dec, num, id] = m;
      let cls = null;
      if (com) cls = "com";
      else if (str) cls = "str";
      else if (dec) cls = "dec";
      else if (num) cls = "num";
      else if (id) {
        const kw = py ? PY_KW : C_KW;
        if (kw.has(id)) cls = "kw";
        else if (py && PY_BI.has(id)) cls = "bi";
        else if (prevWord === "def" || prevWord === "class" || code[re.lastIndex] === "(") cls = "fn";
        prevWord = id;
      }
      out += cls ? `<span class="tk-${cls}">${esc(tok)}</span>` : esc(tok);
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  // ---------------------------------------------------------------- pyodide
  let pyodidePromise = null;
  function getPyodide(log) {
    if (!pyodidePromise) {
      log("Loading Python (Pyodide) into your browser — first time only, ~10 s…", "sys");
      pyodidePromise = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = PYODIDE_URL + "pyodide.js";
        s.onload = async () => {
          try { resolve(await window.loadPyodide({ indexURL: PYODIDE_URL })); } catch (e) { reject(e); }
        };
        s.onerror = () => reject(new Error("Could not load Pyodide. Are you offline? Run the labs locally instead."));
        document.head.appendChild(s);
      }).catch((e) => { pyodidePromise = null; throw e; });
    }
    return pyodidePromise;
  }

  async function runPython(code, consoleEl) {
    consoleEl.innerHTML = '<span class="label">output</span>';
    const log = (text, cls = "") => {
      const span = document.createElement("span");
      if (cls) span.className = cls;
      span.textContent = text + "\n";
      consoleEl.appendChild(span);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    };
    try {
      const py = await getPyodide(log);
      py.setStdout({ batched: (s) => log(s) });
      py.setStderr({ batched: (s) => log(s, "tk-dec") });
      await py.loadPackagesFromImports(code, { messageCallback: (m) => log(m, "sys"), errorCallback: (m) => log(m, "err") });
      const ns = py.globals.get("dict")();
      ns.set("__name__", "__main__");
      const t0 = performance.now();
      await py.runPythonAsync(code, { globals: ns });
      ns.destroy();
      log(`\n✓ finished in ${Math.round(performance.now() - t0)} ms`, "sys");
    } catch (e) {
      // Keep only the user-relevant part of the traceback.
      const msg = String(e.message || e);
      const i = msg.indexOf('File "<exec>"');
      log(i >= 0 ? "Traceback (most recent call last):\n  " + msg.slice(i) : msg, "err");
    }
  }

  // ---------------------------------------------------------------- editor
  function makeEditor(container, initial, lang, editable) {
    container.innerHTML = '<div class="editor-inner"><pre></pre></div>';
    const inner = $(".editor-inner", container);
    const pre = $("pre", inner);
    const paint = (v) => { pre.innerHTML = highlight(v, lang) + "\n "; };
    paint(initial);
    if (!editable) return { get value() { return initial; } };
    const ta = document.createElement("textarea");
    ta.spellcheck = false;
    ta.setAttribute("aria-label", "Python code editor");
    ta.value = initial;
    inner.appendChild(ta);
    ta.addEventListener("input", () => paint(ta.value));
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const { selectionStart: a, selectionEnd: b } = ta;
        ta.setRangeText("    ", a, b, "end");
        paint(ta.value);
      }
    });
    return {
      get value() { return ta.value; },
      set value(v) { ta.value = v; paint(v); },
      textarea: ta,
    };
  }

  // ---------------------------------------------------------------- top tabs + sidebar
  function renderTabs(activeId) {
    $("#track-tabs").innerHTML = TRACKS.map((t) =>
      `<a href="#/${t.id}/1" class="${t.id === activeId ? "active" : ""}">${t.icon} ${t.title}</a>`).join("");
  }

  function renderSidebar(track, stepIdx) {
    const el = $("#sidebar");
    if (!track) {
      el.innerHTML = `<div class="side-title">Tracks</div><ul class="step-list">` +
        TRACKS.map((t) => `<li><a href="#/${t.id}/1"><span class="step-num">${t.icon}</span>
          <span class="step-title">${t.title}<br><small>${trackProgress(t)}/${t.steps.length} done</small></span></a></li>`).join("") +
        `</ul>`;
      return;
    }
    const pct = Math.round((trackProgress(track) / track.steps.length) * 100);
    el.innerHTML = `
      <div class="side-title">${track.icon} ${track.title} · ${pct}%</div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <ol class="step-list">${track.steps.map((s, i) => {
        const key = `${track.id}/${i + 1}`;
        const cls = [i === stepIdx ? "active" : "", done.has(key) ? "done" : ""].join(" ");
        return `<li><a href="#/${key}" class="${cls}"><span class="step-num">${done.has(key) ? "✓" : i + 1}</span>
          <span class="step-title">${s.title}</span></a></li>`;
      }).join("")}</ol>`;
  }

  // ---------------------------------------------------------------- home
  function renderHome() {
    renderTabs(null);
    renderSidebar(null);
    document.title = "Python Academy";
    $("#main").innerHTML = `
      <section class="hero">
        <div class="step-bar"><span class="kicker">For Java & C# engineers</span></div>
        <h1>Learn Python the way systems <em>actually flow</em>.</h1>
        <p>Each track is a lifecycle: follow a request through an API, a CSV through an ETL pipeline, or a question through an LLM app.
        Every step lights up one stage, shows the data at that point, and gives you <b>runnable Python</b> next to the Java/C# you already know.</p>
      </section>
      <div class="cards">${TRACKS.map((t) => `
        <a class="card" href="#/${t.id}/1">
          <span class="icon">${t.icon}</span>
          <h3>${t.title}</h3>
          <p>${t.tagline}</p>
          <span class="meta"><span>${t.steps.length} steps · ${t.nodes.length} stages</span><span>${trackProgress(t)}/${t.steps.length} ✓</span></span>
        </a>`).join("")}
      </div>
      <div class="how">
        <div><b>1 · Follow the flow</b>The diagram shows where you are in the lifecycle. Click any stage to jump.</div>
        <div><b>2 · Run & break the code</b>Edit the Python and press Run (or Ctrl/⌘ + Enter). It runs in your browser.</div>
        <div><b>3 · Compare</b>Switch to the Java/C# tab to map the idea onto what you know.</div>
        <div><b>4 · Lock it in</b>Answer the check question to mark the step done. Then build the labs in <code>labs/</code>.</div>
      </div>`;
  }

  // ---------------------------------------------------------------- step
  let lastNode = null;

  function renderStep(track, idx) {
    const step = track.steps[idx];
    const key = `${track.id}/${idx + 1}`;
    const runnable = step.run !== false;
    renderTabs(track.id);
    renderSidebar(track, idx);
    document.title = `${step.title} · Python Academy`;

    const activeIdx = track.nodes.findIndex((n) => n.id === step.node);
    const flow = track.nodes.map((n, i) => {
      const cls = i === activeIdx ? "active visited" : i < activeIdx ? "visited" : "";
      const link = i < track.nodes.length - 1 ? `<div class="link ${i < activeIdx ? "visited" : ""}"></div>` : "";
      return `<button class="node ${cls}" data-node="${n.id}">${n.label}</button>${link}`;
    }).join("");

    const prev = idx > 0 ? `#/${track.id}/${idx}` : null;
    const next = idx < track.steps.length - 1 ? `#/${track.id}/${idx + 2}` : null;
    const nextTrack = TRACKS[TRACKS.indexOf(track) + 1];

    $("#main").innerHTML = `
      <div class="track-head">
        <div><h1>${track.icon} ${track.title}</h1><p>${track.tagline}</p></div>
      </div>
      <section class="stage" aria-label="Lifecycle diagram">
        <div class="flow">${flow}<div class="packet"></div></div>
        <div class="payload"><span>data at this stage</span><code>${esc(step.payload)}</code></div>
      </section>

      <div class="step-bar">
        <div>
          <span class="kicker">Step ${idx + 1} of ${track.steps.length}</span>
          <h2>${step.title}</h2>
        </div>
        <div class="nav-btns">
          <button class="btn" data-go="${prev || ""}" ${prev ? "" : "disabled"}>← Prev</button>
          <button class="btn primary" data-go="${next || (nextTrack ? `#/${nextTrack.id}/1` : "#/")}">
            ${next ? "Next →" : nextTrack ? `Next track: ${nextTrack.title} →` : "Finish 🎉"}</button>
        </div>
      </div>

      <div class="grid">
        <div>
          <article class="panel concept">${step.concept}<div class="tip"><b>💡 Tip.</b> ${step.tip}</div></article>
          <section class="panel quiz">
            <h4>Check yourself</h4>
            <p class="q">${step.quiz.q}</p>
            ${step.quiz.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join("")}
            <div class="why" hidden></div>
          </section>
        </div>
        <section class="panel code-panel">
          <div class="tabs">
            <button class="active" data-tab="py">Python</button>
            <button data-tab="cmp">${step.compare.lang}</button>
            <span class="spacer"></span>
            <span class="run-actions">${runnable
              ? `<button class="btn" data-act="reset" title="Restore the original code">Reset</button>
                 <button class="btn primary" data-act="run" title="Ctrl/⌘ + Enter">▶ Run</button>`
              : ""}</span>
          </div>
          <div class="editor" data-pane="py"></div>
          <div class="editor" data-pane="cmp" hidden></div>
          ${runnable
            ? `<div class="console"><span class="label">output</span><span class="sys">Press ▶ Run (or Ctrl/⌘ + Enter). Edit the code freely: break it, fix it.</span></div>`
            : `<div class="local-note">🖥️ This snippet needs a real server, threads or packages that do not run in the browser.
               Run the matching lab locally — see <code>labs/README.md</code>.</div>`}
        </section>
      </div>
      <div class="footer-nav">
        <span class="kbd">← → to navigate</span>
        <span class="kbd">Ctrl/⌘ + Enter to run</span>
      </div>`;

    // editor + compare
    const editor = makeEditor($('[data-pane="py"]'), step.code, "python", runnable);
    makeEditor($('[data-pane="cmp"]'), step.compare.code, "other", false);
    const consoleEl = $(".console");

    $(".tabs").addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab]");
      if (tab) {
        document.querySelectorAll(".tabs [data-tab]").forEach((b) => b.classList.toggle("active", b === tab));
        document.querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== tab.dataset.tab));
      }
      const act = e.target.closest("[data-act]");
      if (act?.dataset.act === "run") runPython(editor.value, consoleEl);
      if (act?.dataset.act === "reset") editor.value = step.code;
    });
    if (editor.textarea) {
      editor.textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runPython(editor.value, consoleEl); }
      });
    }

    // navigation
    document.querySelectorAll("[data-go]").forEach((b) =>
      b.addEventListener("click", () => { if (b.dataset.go) location.hash = b.dataset.go; }));
    document.querySelectorAll(".node").forEach((n) => n.addEventListener("click", () => {
      const i = track.steps.findIndex((s) => s.node === n.dataset.node);
      if (i >= 0) location.hash = `#/${track.id}/${i + 1}`;
    }));

    // quiz
    const quiz = $(".quiz");
    const showAnswer = (picked) => {
      quiz.querySelectorAll(".opt").forEach((b) => {
        const i = Number(b.dataset.i);
        b.disabled = true;
        if (i === step.quiz.answer) b.classList.add("right");
        else if (i === picked) b.classList.add("wrong");
      });
      const why = $(".why", quiz);
      why.hidden = false;
      why.innerHTML = (picked === step.quiz.answer ? "✅ Correct. " : "❌ Not quite. ") + step.quiz.why;
    };
    quiz.addEventListener("click", (e) => {
      const b = e.target.closest(".opt");
      if (!b || b.disabled) return;
      const picked = Number(b.dataset.i);
      showAnswer(picked);
      if (picked === step.quiz.answer) { markDone(key); renderSidebar(track, idx); }
      else setTimeout(() => {   // allow a retry
        quiz.querySelectorAll(".opt").forEach((o) => { o.disabled = false; o.classList.remove("right", "wrong"); });
      }, 2500);
    });
    if (done.has(key)) showAnswer(step.quiz.answer);

    animatePacket(track, step.node);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  // The glowing packet travels from the previous step's stage to the current one.
  function animatePacket(track, nodeId) {
    const flow = $(".flow");
    const packet = $(".packet", flow);
    const target = $(`.node[data-node="${nodeId}"]`, flow);
    const from = lastNode && lastNode.track === track.id
      ? $(`.node[data-node="${lastNode.node}"]`, flow) : target;
    const place = (el) => {
      packet.style.left = `${el.offsetLeft + el.offsetWidth / 2 - 7}px`;
      packet.style.top = `${el.offsetTop - 16}px`;
    };
    packet.style.transition = "none";
    place(from);
    void packet.offsetWidth;        // force reflow so the transition runs
    packet.style.transition = "";
    requestAnimationFrame(() => place(target));
    flow.scrollTo({ left: target.offsetLeft - flow.clientWidth / 2 + target.offsetWidth / 2, behavior: "smooth" });
    lastNode = { track: track.id, node: nodeId };
  }

  // ---------------------------------------------------------------- router
  function route() {
    const [, trackId, stepStr] = location.hash.split("/");
    const track = TRACKS.find((t) => t.id === trackId);
    if (!track) return renderHome();
    const idx = Math.min(Math.max(parseInt(stepStr, 10) || 1, 1), track.steps.length) - 1;
    renderStep(track, idx);
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("textarea, input") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight") $('[data-go].primary')?.click();
    if (e.key === "ArrowLeft") $('.nav-btns [data-go]:not(.primary):not(:disabled)')?.click();
  });
  window.addEventListener("hashchange", route);
  route();
})();
