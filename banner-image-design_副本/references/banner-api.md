# Banner API

## Fixed Defaults

The bundled `scripts/generate_banner.py` is pinned to these local defaults:

- default model: `gemini-3.1-flash-image-preview`
- default base URL root: `http://zx2.52youxi.cc:3000`
- default API format: `gemini`

This means the script uses the native Gemini REST route by default, while still supporting the Gemini OpenAI-compatible route when requested explicitly.

## Fixed Paths

Native Gemini format:

- `http://zx2.52youxi.cc:3000/v1beta/models/{model}:generateContent`

Gemini OpenAI-compatible format:

- `http://zx2.52youxi.cc:3000/v1beta/openai/chat/completions`

Callers should pass only the root `--base-url`. The script appends the fixed native or OpenAI-compatible path automatically.

## Request Shapes

Native Gemini mode sends:

- one enhanced text prompt
- optional inline reference images from local files
- `generationConfig.responseModalities = ["IMAGE", "TEXT"]`

OpenAI-compatible mode sends:

- one `messages` array with `content`
- `type: "text"` for the prompt
- `type: "image_url"` with inline data URLs for reference images
- `extra_body.google.image_config` for aspect ratio and image size

The script accepts image bytes from either:

- `candidates[].content.parts[].inlineData.data`
- `choices[].message.images[].b64_json`
- `choices[].message.images[].image_url.url`
- `data[].b64_json`

## Authentication

Pass the key directly:

```bash
python3 scripts/generate_banner.py \
  --api-key "YOUR_API_KEY" \
  --prompt "春季活动横幅，清透明亮，有空气感和层次，无文字" \
  --output /tmp/banner.png
```

Or set:

```bash
export NANO_BANANA_API_KEY="your-api-key"
export GEMINI_API_KEY="your-api-key"
```

Priority order:

1. `--api-key`
2. `GEMINI_API_KEY`
3. `NANO_BANANA_API_KEY`

## Format Selection

Default mode uses the native Gemini route:

```bash
python3 scripts/generate_banner.py \
  --prompt "联名活动主视觉横版 banner，主体鲜明，流光与漂浮元素增加动势，无文字" \
  --output /tmp/banner-gemini-default.png
```

To force the Gemini OpenAI-compatible format:

```bash
python3 scripts/generate_banner.py \
  --api-format openai \
  --prompt "联名活动主视觉横版 banner，主体鲜明，流光与漂浮元素增加动势，无文字" \
  --output /tmp/banner-openai.png
```

To force the native Gemini format explicitly:

```bash
python3 scripts/generate_banner.py \
  --api-format gemini \
  --prompt "联名活动主视觉横版 banner，主体鲜明，流光与漂浮元素增加动势，无文字" \
  --output /tmp/banner-gemini.png
```

To try native first and fall back automatically:

```bash
python3 scripts/generate_banner.py \
  --api-format auto \
  --prompt "联名活动主视觉横版 banner，主体鲜明，流光与漂浮元素增加动势，无文字" \
  --output /tmp/banner-auto.png
```

## Recommended Prompt Shape

Write prompts in this order:

1. Campaign subject
2. Main scene or hero object
3. Color palette and lighting
4. Motion and atmosphere
5. Composition and text-safe area
6. Brand or style constraints
7. `无文字` or any text rule

The bundled script automatically adds extra direction for:

- more lively motion
- layered foreground and background depth
- polished promotional quality
- avoiding flat, stiff, or cluttered results
- avoiding low-end festive poster aesthetics
- avoiding childish mascot rendering and stiff front-facing poses

You should still make the user-facing prompt concrete and visual rather than abstract.

## Example

```bash
python3 scripts/generate_banner.py \
  --prompt "春日联名活动横版主视觉，奶油暖色背景，右侧角色主体，花枝、金色流光与细小漂浮粒子带来轻盈动势，左侧留出大面积干净文案区，无文字" \
  --reference assets/gallery/爱意正浓，年味正盛.png \
  --reference assets/gallery/Aicoin LOGO.png \
  --output /tmp/spring-banner.png
```

Mascot-focused prompt pattern:

```text
严格参考上传的吉祥物形象，保持原本识别度不变，让吉祥物作为唯一主角，以自然的半侧身姿态和轻微动作出现在画面中右侧。整体走高级商业插画风格，色彩克制，光影柔和通透，背景只保留少量节日元素衬托氛围，避免低幼、避免土味、避免正面站桩、避免元素堆砌，无文字。
```

## Failure Handling

If the request hits auth, quota, rate-limit, transport, or gateway errors:

- keep the final prompt
- keep a short negative prompt
- keep the intended size or ratio
- return those as the fallback deliverable

Do not discard the prompt just because the API failed.

## If The Model API Changes

Patch `scripts/generate_banner.py` in these places only:

1. `build_payload()` when the native Gemini request body changes
2. `build_openai_payload()` when the OpenAI-compatible request body changes
3. `extract_image_bytes()` when native Gemini image data moves
4. `extract_openai_image_bytes()` when OpenAI-compatible image data moves
5. `resolve_endpoint()` or `resolve_openai_endpoint()` when the fixed path changes

Do not redesign the skill when only the REST schema changes.
