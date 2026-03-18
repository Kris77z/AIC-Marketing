---
name: banner-image-design
description: Generate event banners, campaign hero images, KV visuals, or promotional cover art from a short brief, optional API credentials, and optional reference assets. Use when the user wants a directly usable 横版 banner、活动头图、主视觉海报、KV 图、宣传图, especially when they want the API workflow and bundled gallery preserved and the image to feel more lively, airy, layered, and expressive rather than flat or generic.
---

# Banner Image Design

## Overview

Use this skill to produce a banner image or a production-ready banner prompt from a short campaign brief.
Keep the workflow simple: write the prompt, attach optional references from the bundled gallery or user assets, then generate through the bundled API script when credentials are available.
This bundled version defaults to the shared gateway `http://zx2.52youxi.cc:3000` and expects credentials from `--api-key`, `GEMINI_API_KEY`, or `NANO_BANANA_API_KEY`.

Default visual direction:

- 灵动，不僵硬
- 有空气感和呼吸感
- 有前后层次和光影流动
- 画面有轻微动势，不做呆板平铺
- 精致、干净、适合活动头图或品牌宣传
- 高级，不土，不像县城开业海报
- 克制，不靠大红大金和元素堆砌制造节日感
- 有姿态设计，不做正面站桩和僵硬摆拍

## Workflow

1. Confirm the subject, usage scene, and whether the user wants an actual image file or only a prompt.
2. Identify any brand anchors, logos, mascots, or bundled gallery images that should be referenced.
3. If a mascot or IP reference is present, default to mascot strong-lock mode unless the user explicitly asks for another main subject.
4. Write a prompt that defines subject, atmosphere, motion, layering, color rhythm, and composition.
5. Run `scripts/generate_banner.py` when API credentials are available.
6. If the API fails, return the final prompt, negative prompt, and suggested ratio as the fallback deliverable.

## Inputs

Use whatever the user provides:

- Activity theme, campaign subject, or scene
- Brand names, logos, IP characters, or mandatory elements
- Optional API key or token override for the shared gateway
- Optional compatible base URL override when the caller must route elsewhere
- Optional user reference images
- Optional request for a specific size such as `1536x1024`, `1920x1080`, or `3840x2160`

If the user omits some of these, do not block. Fill the gap with a strong prompt and state which hard constraints were missing.

If the user provides a mascot, IP, or bundled mascot reference, treat that as a hard identity constraint, not a loose inspiration cue.

## Prompt Rules

Every banner prompt should cover these six dimensions:

1. Main subject and event theme
2. Scene or focal objects
3. Color system and lighting
4. Motion, atmosphere, and depth
5. Composition and text-safe negative space
6. Style constraints and "no text" requirement when applicable

By default, bias the image toward these qualities:

- 柔和但明确的主光源
- 轻微风感、飘带、粒子、花枝、云气、光斑、丝带、烟火、流光等动势元素
- 清晰的前景、中景、背景分层
- 适度留白，方便后续排版
- 主体明确，不堆砌元素
- 角色或主体有自然姿态变化，避免笔直站立
- 节日色彩有层次，主色克制，点缀色明确
- 画面先像高级插画或品牌 KV，再像活动图

Default subject policy:

- If a mascot or IP reference exists, make it the only hero subject by default
- Do not introduce a human model, extra mascot, or substitute character unless the user explicitly asks for it
- Treat mascot silhouette, facial identity, palette, and recognizability as hard constraints
- When the brief is ambiguous, prefer mascot-led composition over generic lifestyle scenes

Translate vague user language into concrete image directions:

- "高级" -> define material quality, restrained palette, clear light direction, and cleaner background hierarchy
- "热闹" -> use one focused action plus drifting accent elements, not uniform clutter
- "节日感" -> express through glow, fabric, metallic highlights, lantern light, seasonal branches, or atmosphere cues rather than symbol stacking
- "年轻" -> lighter rhythm, fresher contrast, relaxed pose, brighter air, not neon overload
- "有冲击力" -> create focal contrast through scale, lighting, and silhouette, not excessive saturation
- "梦幻" -> specify haze, bloom, soft rim light, floating particles, layered depth, and controlled highlights

Avoid these failure modes unless the user explicitly asks for them:

- 生硬海报感
- 平铺贴图感
- 元素平均分布导致没有视觉重心
- 过度促销、廉价电商、荧光脏色
- 文字、乱码、水印、错误 logo、主体畸形
- 正面站桩、四肢僵硬、像证件照一样的主体
- 低幼 Q 版、廉价萌系、塑料感 3D
- 大红大金乱堆、背景塞满、没有呼吸感
- 五官敷衍、手部错误、吉祥物识别度丢失

## Prompt Assembly

Build the prompt in this order so the model gets concrete instructions before style adjectives:

1. Subject lock: who or what is the main hero, and what must remain accurate
2. Scene anchor: where the subject appears and which props support the idea
3. Pose or action: one clear movement, gesture, or interaction
4. Composition: where the subject sits and where copy-safe space remains
5. Palette and light: one main palette, one accent, one dominant light direction
6. Atmosphere and depth: foreground, midground, background, plus restrained motion cues
7. Style finish: premium illustration or polished commercial KV quality
8. Negative block: rule out ugly, cheap, noisy, or incorrect outcomes

For mascot strong-lock mode, explicitly include:

1. strict mascot identity preservation
2. no human substitution
3. mascot as the only visual hero
4. one designed pose
5. supporting background only
6. mascot-specific negative constraints

When the user brief is thin, prefer adding specificity in this order:

- subject accuracy
- composition and blank space
- lighting and palette
- depth and motion
- style polish

## Output Format

When the user asks for prompt-only output, return:

1. `Final Prompt`
2. `Negative Prompt`
3. `Suggested Size`
4. `Reference Strategy` when references are useful

Keep the final prompt as one polished paragraph in Chinese unless the user requests another format.

## Composition Defaults

Use these defaults unless the user overrides them:

- Banner or hero image: keep a readable visual center and reserve one side for copy placement
- Festive or emotional campaigns: favor warm highlights, drifting accents, and richer depth cues
- Brand co-marketing: make logos accurate and secondary to the main focal scene unless the user asks for logo-led composition
- Mascot or IP-led art: let the character carry the energy while background elements support the mood

For mascot-led images specifically:

- Reference the mascot strictly and preserve core silhouette, color, and facial identity
- Default to mascot-led art whenever mascot material is available, unless the user explicitly overrides that
- Give the mascot a designed pose: half-turn, reaching, greeting, stepping, leaning, or looking back
- Use the background only to serve the character mood, not to compete with it
- Prefer premium illustration, polished commercial art, or storybook editorial quality over cheap cartoon rendering
- Keep the mascot as the only hero subject; logos, props, and scenery are secondary

Scene defaults:

- Spring or romantic campaigns: creamy warm base, floral or ribbon accents, gentle side light, soft glow, lighter depth rhythm
- Mid-autumn or festive Chinese campaigns: warm moonlight or lantern glow, richer red-gold accents in small doses, elegant cloud or architecture cues, avoid crowded symbolism
- Financial or tech campaigns: cleaner geometry, more controlled highlights, glass, metallic, or light-trail accents, avoid generic sci-fi blue overload
- Co-branded campaigns: one clear hero scene first, brand identifiers second, logos accurate but not oversized unless explicitly requested
- Product-led banners: treat the product as the hero object with realistic scale, hero light, premium material rendering, and a quieter supporting background

## Prompt Writing Heuristics

When a generated image looks ugly, the prompt is usually failing in one of these ways:

- It asks for "festive" but not for restraint, so the model piles on red, gold, lanterns, and clutter
- It asks for "cute" but not for anatomy or pose quality, so the model collapses into low-end mascot art
- It asks for "dynamic" but not for composition, so the canvas fills with noisy motion instead of one clear action
- It asks for "advanced" in abstract words, but gives no concrete light, pose, or focal guidance

Correct for that by writing prompts with:

- one clear hero subject
- one clear action or pose
- one controlled color system
- one dominant light direction
- one composition instruction for copy-safe space
- one negative block that explicitly rules out ugly outcomes

If the user gives a weak prompt, rewrite it instead of lightly editing it.
Upgrade "activity poster" language into banner-ready direction with:

- a specific hero
- a specific layout side for copy
- one motion cue
- one material or light cue
- one quality bar such as "premium commercial illustration" or "brand KV"

## Prompt Templates

Use mascot strong-lock mode first whenever a mascot/IP reference is available. Only fall back to the universal scaffold when there is no mascot-style hard constraint.

Mascot strong-lock mode:

```text
严格使用提供的吉祥物形象作为唯一视觉核心，保持原本轮廓、配色、表情识别度和核心特征不变，不要替换成人物，不要生成第二个角色，不要改成别的动物或泛化卡通形象。让吉祥物位于画面[右侧/中右侧]，以[半侧身/迈步/挥手/回头微笑/伸手迎接]的自然姿态形成明确视觉重心。整体配色控制在[主色] + [辅色] + 少量[点缀色]，光线为[柔和侧光/暖调逆光/晨曦感主光]，背景只保留少量[花枝/丝带/流光/粒子/灯笼/云气]作为氛围陪衬，前景、中景、背景分层清楚，[左侧/另一侧]保留大面积干净留白用于后续排版。整体质感像高级商业插画或品牌 KV，精致、统一、克制，无文字，无水印。
```

Use this universal scaffold when there is no mascot/IP hard constraint:

```text
[主体锁定与准确性要求]。让[主体]作为画面唯一视觉核心，出现在[左侧/中左侧/右侧/中右侧]，以[动作/姿态]形成明确视觉重心。[场景或辅助物]只作为陪衬，不抢主体。整体采用[主色] + [辅色] + 少量[点缀色]的配色，光线为[主光方向与性质]，画面有清晰前景、中景、背景分层，并加入少量[粒子/花枝/丝带/流光/云气/光斑]营造空气感和轻微动势。[另一侧]保留干净留白用于后续排版。整体质感像高级商业插画或品牌 KV，精致、克制、统一，无文字，无水印。
```

Use this tighter variant when mascot identity accuracy is the top priority:

```text
严格参考上传的吉祥物形象，保持原本轮廓、配色、表情识别度和核心特征不变。吉祥物必须成为唯一主角，不允许出现人物替代，不允许增加第二角色，不允许改成别的动物或低幼泛化形象。让吉祥物以[半侧身/迈步/挥手/拱手拜年/回头微笑]的自然姿态出现在画面[右侧/中右侧]。整体风格走高级商业插画路线，配色控制在[主色] + [辅色] + 少量[点缀色]，光线[柔和侧光/暖调逆光/晨曦感主光]，背景只保留少量[灯笼/花枝/流光/粒子/丝带]作为氛围元素，前中后景分层清楚，左侧保留大面积干净留白，无文字，无水印。
```

Use this template for co-branded campaign banners:

```text
为[品牌A] x [品牌B] 联名活动生成横版主视觉。准确参考上传的 logo/IP/产品素材，但不要让 logo 成为最大主体。让[吉祥物/人物/核心物件]作为主角出现在画面[右侧/中右侧]，以[迎接/迈步/展示/互动]的姿态建立故事感。画面整体更像品牌联名 KV，而不是促销海报；配色以[主色]为主，融合[品牌辅助色]作为点缀，光线[暖调侧光/高质感逆光/柔和聚光]，背景加入少量[建筑轮廓/飘带/光粒/花枝/礼盒]增强氛围，层次清楚，左侧保留大面积留白，无文字，无水印，避免廉价电商感和元素堆砌。
```

Use this template for product-led banners:

```text
以[产品名称/功能载体]作为唯一主视觉核心，按商业广告 KV 的方式表现，主体置于画面[中右侧/中部]，比例明确、结构准确、材质高级。[场景元素]仅作为氛围支撑，不能喧宾夺主。整体配色控制在[主色] + [辅色]，通过[边缘高光/反射光/体积光/柔和投影]塑造体积和精致感，前景可加入少量[粒子/花瓣/流光/玻璃反射]增加空间层次，[左侧/右侧]保留文案留白。整体统一、克制、品牌化，无文字，无水印。
```

Use this template for festive or emotional illustration banners:

```text
生成一张适合活动首页头图的横版节日插画主视觉，以[主体]为视觉中心，出现在画面[右侧/中右侧]，通过[回头/伸手/行进/停驻微笑]的姿态传达情绪。氛围关键词为[喜庆但克制/温暖治愈/明亮通透/梦幻轻盈]，主色为[主色]，辅以[辅色]和少量[点缀金色或高光色]。光线采用[晨曦感主光/暖调灯笼光/柔和逆光]，背景用少量[花枝/灯笼/云纹/烟火光斑/丝带/流光]建立节日感，前中后景分层明确，留出一侧干净区域用于文案排版。整体像高级品牌插画海报，不像低端节庆海报，无文字，无水印。
```

For festive images, explicitly add:

- 喜庆但克制
- 高级，不俗气
- 节日氛围来自光感和材质，而不是元素堆砌

For brand banners, explicitly add:

- 像品牌 KV，不像促销弹窗
- 质感统一
- 主体清楚，背景退后

## Negative Prompt Patterns

Use a compact negative prompt that matches the scene instead of a generic dump.

Base negative prompt:

```text
避免文字、乱码、水印、错误 logo、错误品牌色、主体畸形、手部错误、五官崩坏、构图松散、元素平均铺满、廉价促销海报感、低端电商感、荧光脏色、塑料感、低幼卡通感、背景过满、视觉重心不清。
```

Add these selectively:

- Mascot or character work: `避免人物替代吉祥物、避免增加第二角色、避免站桩姿势、避免表情僵硬、避免吉祥物识别度丢失、避免比例失衡、避免改成别的动物或泛化卡通形象`
- Festive scenes: `避免大红大金乱堆、俗气节庆装饰、拥挤符号堆砌`
- Tech or finance scenes: `避免廉价赛博蓝紫、过度科幻 UI、悬浮乱码面板`
- Product scenes: `避免产品变形、比例错误、材质发糊、反光脏乱`

## Reference Strategy

Use references deliberately instead of attaching everything:

- one character or mascot reference for identity lock
- one logo reference per required brand
- one mood reference for palette, atmosphere, or composition rhythm
- avoid mixing too many style references that fight each other

When a mascot reference is attached:

- always mention that the mascot is the only hero subject
- always say not to replace it with a human figure
- always say not to add extra characters unless explicitly requested

If references conflict, prioritize:

1. brand and mascot accuracy
2. composition suitability for banner usage
3. atmosphere and rendering style

## Generation Workflow

Read [banner-api.md](references/banner-api.md) when you need auth, model, or request details.

Typical call:

```bash
python3 scripts/generate_banner.py \
  --api-key "USER_SUPPLIED_KEY" \
  --prompt "春日活动横版主视觉，轻盈明亮，花枝与流光营造空气感，画面右侧主体鲜明，左侧留白，无文字" \
  --reference assets/gallery/爱意正浓，年味正盛.png \
  --output /tmp/banner-image-design.png
```

Because the script already defaults to the shared gateway, `--base-url` is usually unnecessary when using the default route.

Verified working path in this workspace:

```bash
export GEMINI_API_KEY="YOUR_API_KEY"
python3 scripts/generate_banner.py \
  --prompt "春季活动横版 banner，明亮通透，暖金奶油色调，主体集中在右侧，左侧留白，无文字" \
  --output /tmp/banner-image-design-env-test.png
```

Verified successful output path:

- `/tmp/banner-image-design-env-test.png`

If the user provides multiple reference files, add repeated `--reference` flags.

## Fallback Contract

If the API cannot return an image, do not stop at the error.
Return:

1. One polished final Chinese prompt
2. One concise negative prompt
3. Suggested ratio or pixel size
4. A short note saying the prompt is the fallback deliverable

## Resources

### scripts/
- `generate_banner.py`: generate banner images through the configured Gemini-compatible image API

### references/
- `banner-api.md`: auth, model, payload, and fallback notes

### assets/
- `assets/gallery/`: bundled reference materials that can be passed into the image API as visual anchors
