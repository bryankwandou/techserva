"""Records the sales video voice-over, one file per language that has a neural voice.
Usage: python scripts/voice.py [code ...]     (no codes: every language that is still missing)
Each of the seven lines is spoken, fitted to its scene, and placed at the scene start. Output: src/media/vo/<code>.mp3"""
import asyncio, json, pathlib, subprocess, sys, tempfile, zlib
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "media" / "vo"
STARTS = [0.4, 5.5, 11.4, 18.3, 29.3, 39.3, 45.9]
ENDS = [5.1, 10.9, 17.9, 28.9, 38.9, 45.4, 51.6]
ALIAS = {"iw": "he", "jw": "jv", "tl": "fil", "no": "nb", "yue": "zh-HK", "zh-CN": "zh-CN", "zh-TW": "zh-TW"}
HOME = {"en": "en-US", "es": "es-ES", "pt": "pt-BR", "fr": "fr-FR", "de": "de-DE", "ar": "ar-SA", "zh": "zh-CN", "nl": "nl-NL", "sv": "sv-SE",
        "bn": "bn-BD", "ta": "ta-IN", "ur": "ur-PK", "sw": "sw-KE", "it": "it-IT", "ko": "ko-KR", "ms": "ms-MY", "fa": "fa-IR"}
PICK = {"en": "en-US-AndrewMultilingualNeural", "id": "id-ID-ArdiNeural", "da": "da-DK-JeppeNeural", "ro": "ro-RO-EmilNeural", "th": "th-TH-NiwatNeural"}


def lines():
    js = "import('./data/copy.mjs').then(m=>console.log(JSON.stringify([1,2,3,4,5,6,7].map(i=>m.ui['vo_'+i]))))"
    return json.loads(subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)


def voice_for(code, voices):
    if code in PICK: return PICK[code]
    loc = ALIAS.get(code, code)
    if "-" in loc:
        c = [v for v in voices if v["Locale"] == loc]
    else:
        c = [v for v in voices if v["Locale"].split("-")[0] == loc]
        home = [v for v in c if v["Locale"] == HOME.get(loc)]
        c = home or c
    if not c: return None
    c.sort(key=lambda v: v["ShortName"])
    return c[zlib.crc32(code.encode()) % len(c)]["ShortName"]


def dur(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip())


async def one(code, voice, text, tmp):
    parts = []
    for i, t in enumerate(text):
        p = tmp / f"{code}-{i}.mp3"
        for attempt in range(4):
            try:
                await edge_tts.Communicate(t, voice).save(str(p)); break
            except Exception:
                if attempt == 3: raise
                await asyncio.sleep(2 + attempt * 2)
        parts.append(p)
    cmd, flt = ["ffmpeg", "-y", "-loglevel", "error"], []
    for i, p in enumerate(parts):
        tempo = min(1.45, max(1.0, dur(p) / (ENDS[i] - STARTS[i])))
        cmd += ["-i", str(p)]
        flt.append(f"[{i}]atempo={tempo:.3f},adelay={int(STARTS[i] * 1000)}[a{i}]")
    flt.append("".join(f"[a{i}]" for i in range(7)) + "amix=inputs=7:normalize=0,loudnorm=I=-17:TP=-1.5,apad=whole_dur=52[o]")
    cmd += ["-filter_complex", ";".join(flt), "-map", "[o]", "-t", "52", "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "40k", str(OUT / f"{code}.mp3")]
    subprocess.run(cmd, check=True)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    en = lines()
    voices = await edge_tts.list_voices()
    ok = ["en"] + json.loads((ROOT / "data" / "langs-ok.json").read_text())
    want = sys.argv[1:] or [c for c in ok if not (OUT / f"{c}.mp3").exists()]
    used = {}
    with tempfile.TemporaryDirectory() as d:
        for code in want:
            v = voice_for(code, voices)
            if not v: continue
            if code == "en": text = en
            else:
                cache = json.loads((ROOT / "data" / "i18n" / f"{code}.json").read_text(encoding="utf-8"))
                text = [cache.get(s) for s in en]
                if not all(text): print("no text", code); continue
            try:
                await one(code, v, text, pathlib.Path(d)); used[code] = v; print("ok", code, v, flush=True)
            except Exception as e:
                print("ERR", code, v, str(e)[:120], flush=True)
    f = OUT / "voices.json"
    all_used = json.loads(f.read_text()) if f.exists() else {}
    all_used.update(used)
    f.write_text(json.dumps({k: all_used[k] for k in sorted(all_used) if (OUT / f"{k}.mp3").exists()}, indent=0))

asyncio.run(main())
