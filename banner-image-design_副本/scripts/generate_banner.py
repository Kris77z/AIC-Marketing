#!/usr/bin/env python3
"""
Generate a banner image through the Gemini image API.
Supports both the native Gemini REST shape and the Gemini OpenAI-compatible shape.
"""

from __future__ import annotations

import argparse
import base64
import http.client
import json
import mimetypes
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_MODEL = "gemini-3.1-flash-image-preview"
DEFAULT_BASE_URL = "http://zx2.52youxi.cc:3000"
DEFAULT_API_FORMAT = "gemini"
GEMINI_ENDPOINT_PATH = "/v1beta/models/{model}:generateContent"
OPENAI_ENDPOINT_PATH = "/v1beta/openai/chat/completions"


class GeminiRequestError(Exception):
    def __init__(self, message: str, retry_after_seconds: float | None = None):
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


def encode_reference(path: Path) -> dict[str, object]:
    mime_type, _ = mimetypes.guess_type(path.name)
    return {
        "inline_data": {
            "mime_type": mime_type or "application/octet-stream",
            "data": base64.b64encode(path.read_bytes()).decode("ascii"),
        }
    }


def build_text_prompt(args: argparse.Namespace) -> str:
    prompt_parts = [args.prompt.strip()]
    prompt_parts.append(
        (
            "Favor a lively, premium banner with airy atmosphere, flowing light, subtle but readable motion, "
            "clear foreground-midground-background layering, and one unmistakable focal subject."
        )
    )
    prompt_parts.append(
        (
            "Keep the focal subject prominent, preserve readable negative space for later copy placement, "
            "and use restrained composition instead of filling every area with decorative elements."
        )
    )
    prompt_parts.append(
        (
            "Aim for polished brand-key-visual quality or premium editorial illustration quality rather than a "
            "cheap holiday poster, low-end e-commerce art, childish mascot art, or generic clip-art collage."
        )
    )
    prompt_parts.append(
        (
            "If a mascot or character is present, keep the identity stable, avoid stiff front-facing standing poses, "
            "and prefer a natural half-turn, reaching, greeting, stepping, or other designed pose with believable limbs and hands."
        )
    )
    prompt_parts.append(
        (
            "Use a controlled color system, tasteful festive restraint, soft but directional lighting, and depth cues "
            "that create atmosphere without visual clutter."
        )
    )
    prompt_parts.append(f"Target banner size: {args.width}x{args.height}.")
    if args.style:
        prompt_parts.append(f"Preferred visual style: {args.style}.")
    if args.negative_prompt:
        prompt_parts.append(f"Avoid these traits: {args.negative_prompt}.")
    prompt_parts.append(
        "Return an image suitable for a polished promotional banner with elegant motion, strong taste, and clean composition."
    )
    return " ".join(prompt_parts)


def aspect_ratio_from_size(width: int, height: int) -> str:
    if width <= 0 or height <= 0:
        return "16:9"
    ratio = width / height
    known = [
        ("16:9", 16 / 9),
        ("4:3", 4 / 3),
        ("3:2", 3 / 2),
        ("1:1", 1.0),
        ("9:16", 9 / 16),
    ]
    label, _ = min(known, key=lambda item: abs(item[1] - ratio))
    return label


def image_size_tier(width: int, height: int) -> str:
    longest = max(width, height)
    if longest >= 3000:
        return "4K"
    if longest >= 1800:
        return "2K"
    return "1K"


def validate_dimensions(width: int, height: int) -> None:
    if width <= 0 or height <= 0:
        raise ValueError("width and height must be positive integers.")
    if width > 8192 or height > 8192:
        raise ValueError("width and height must be <= 8192.")


def build_payload(args: argparse.Namespace) -> dict[str, object]:
    parts: list[dict[str, object]] = [{"text": build_text_prompt(args)}]
    if args.reference:
        for item in args.reference:
            ref_path = Path(item).expanduser().resolve()
            if not ref_path.exists():
                raise FileNotFoundError(ref_path)
            parts.append(encode_reference(ref_path))

    return {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"],
            "imageConfig": {
                "aspectRatio": aspect_ratio_from_size(args.width, args.height),
                "imageSize": image_size_tier(args.width, args.height),
            },
        },
    }


def encode_reference_data_url(path: Path) -> str:
    mime_type, _ = mimetypes.guess_type(path.name)
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime_type or 'application/octet-stream'};base64,{encoded}"


def build_openai_payload(args: argparse.Namespace) -> dict[str, object]:
    content: list[dict[str, object]] = [{"type": "text", "text": build_text_prompt(args)}]
    if args.reference:
        for item in args.reference:
            ref_path = Path(item).expanduser().resolve()
            if not ref_path.exists():
                raise FileNotFoundError(ref_path)
            content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": encode_reference_data_url(ref_path)},
                }
            )

    return {
        "model": args.model,
        "stream": False,
        "messages": [{"role": "user", "content": content}],
        "extra_body": {
            "google": {
                "image_config": {
                    "aspect_ratio": aspect_ratio_from_size(args.width, args.height),
                    "image_size": image_size_tier(args.width, args.height),
                }
            }
        },
    }


def extract_image_bytes(response_json: dict[str, object]) -> bytes:
    candidates = response_json.get("candidates") or []
    for candidate in candidates:
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            inline = part.get("inlineData") or part.get("inline_data")
            if not isinstance(inline, dict):
                continue
            data = inline.get("data")
            if isinstance(data, str) and data:
                return base64.b64decode(data)
    raise ValueError("Gemini response did not contain inline image data.")


def extract_openai_image_bytes(response_json: dict[str, object]) -> bytes:
    choices = response_json.get("choices") or []
    for choice in choices:
        message = choice.get("message") or {}
        images = message.get("images") or []
        for image in images:
            if not isinstance(image, dict):
                continue
            b64_json = image.get("b64_json")
            if isinstance(b64_json, str) and b64_json:
                return base64.b64decode(b64_json)
            image_url = image.get("image_url") or {}
            if isinstance(image_url, dict):
                url = image_url.get("url")
                if isinstance(url, str) and url.startswith("data:"):
                    _, _, encoded = url.partition(",")
                    if encoded:
                        return base64.b64decode(encoded)

    data_items = response_json.get("data") or []
    for item in data_items:
        if not isinstance(item, dict):
            continue
        b64_json = item.get("b64_json")
        if isinstance(b64_json, str) and b64_json:
            return base64.b64decode(b64_json)
        url = item.get("url")
        if isinstance(url, str) and url.startswith("data:"):
            _, _, encoded = url.partition(",")
            if encoded:
                return base64.b64decode(encoded)

    raise ValueError("OpenAI-compatible response did not contain image data.")


def api_error_message(exc: urllib.error.HTTPError) -> str:
    body = exc.read().decode("utf-8", errors="replace")
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        return f"{exc.code} {body}"

    error = parsed.get("error") or {}
    message = error.get("message") or body
    status = error.get("status")
    details = error.get("details") or []
    if status:
        return f"{exc.code} {status}: {message}"
    if details:
        return f"{exc.code}: {message}"
    return f"{exc.code}: {message}"


def parse_retry_after_seconds(message: str) -> float | None:
    match = re.search(r"Please retry in\s+([0-9]+(?:\.[0-9]+)?)s", message)
    if match:
        return float(match.group(1))
    return None


def resolve_endpoint(base_url: str, model: str) -> str:
    normalized = base_url.rstrip("/")
    return f"{normalized}{GEMINI_ENDPOINT_PATH.format(model=model)}"


def resolve_openai_endpoint(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    return f"{normalized}{OPENAI_ENDPOINT_PATH}"


def build_auth_headers(api_key: str, base_url: str, *, openai_compatible: bool) -> dict[str, str]:
    if openai_compatible:
        return {"Authorization": f"Bearer {api_key}"}
    if "generativelanguage.googleapis.com" in base_url:
        return {"x-goog-api-key": api_key}
    return {"Authorization": f"Bearer {api_key}"}


def call_gemini(
    api_key: str,
    model: str,
    payload: dict[str, object],
    base_url: str,
    timeout_seconds: int,
) -> dict[str, object]:
    url = resolve_endpoint(base_url, model)
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **build_auth_headers(api_key, base_url, openai_compatible=False),
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        return json.loads(response.read().decode("utf-8"))


def call_gemini_with_curl(api_key: str, model: str, payload: dict[str, object], base_url: str) -> dict[str, object]:
    url = resolve_endpoint(base_url, model)
    payload_file: str | None = None
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False)
        payload_file = handle.name
    command = [
        "curl",
        "-sS",
        "-X",
        "POST",
        url,
        "-H",
        "Content-Type: application/json",
        "--data-binary",
        f"@{payload_file}",
    ]
    for key, value in build_auth_headers(api_key, base_url, openai_compatible=False).items():
        command.extend(["-H", f"{key}: {value}"])
    try:
        result = subprocess.run(command, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            stderr = result.stderr.strip() or "unknown curl error"
            raise RuntimeError(f"curl request failed: {stderr}")

        try:
            response_json = json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            raise ValueError(f"curl response was not valid JSON: {exc}") from exc

        error = response_json.get("error")
        if isinstance(error, dict):
            message = error.get("message") or json.dumps(error, ensure_ascii=False)
            status = error.get("status")
            retry_after_seconds = parse_retry_after_seconds(message)
            if status:
                raise GeminiRequestError(f"{status}: {message}", retry_after_seconds=retry_after_seconds)
            raise GeminiRequestError(message, retry_after_seconds=retry_after_seconds)

        return response_json
    finally:
        if payload_file:
            try:
                os.unlink(payload_file)
            except FileNotFoundError:
                pass


def call_openai_compatible(
    api_key: str,
    payload: dict[str, object],
    base_url: str,
    timeout_seconds: int,
) -> dict[str, object]:
    url = resolve_openai_endpoint(base_url)
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **build_auth_headers(api_key, base_url, openai_compatible=True),
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        return json.loads(response.read().decode("utf-8"))


def call_openai_compatible_with_curl(api_key: str, payload: dict[str, object], base_url: str) -> dict[str, object]:
    url = resolve_openai_endpoint(base_url)
    payload_file: str | None = None
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False)
        payload_file = handle.name
    command = [
        "curl",
        "-sS",
        "-X",
        "POST",
        url,
        "-H",
        "Content-Type: application/json",
        "--data-binary",
        f"@{payload_file}",
    ]
    for key, value in build_auth_headers(api_key, base_url, openai_compatible=True).items():
        command.extend(["-H", f"{key}: {value}"])
    try:
        result = subprocess.run(command, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            stderr = result.stderr.strip() or "unknown curl error"
            raise RuntimeError(f"curl request failed: {stderr}")

        try:
            response_json = json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            raise ValueError(f"curl response was not valid JSON: {exc}") from exc

        error = response_json.get("error")
        if isinstance(error, dict):
            message = error.get("message") or json.dumps(error, ensure_ascii=False)
            status = error.get("status")
            retry_after_seconds = parse_retry_after_seconds(message)
            if status:
                raise GeminiRequestError(f"{status}: {message}", retry_after_seconds=retry_after_seconds)
            raise GeminiRequestError(message, retry_after_seconds=retry_after_seconds)

        return response_json
    finally:
        if payload_file:
            try:
                os.unlink(payload_file)
            except FileNotFoundError:
                pass


def should_try_openai_fallback(message: str, base_url: str) -> bool:
    if "generativelanguage.googleapis.com" in base_url:
        return False
    normalized = message.lower()
    return "404" in normalized or "openai_error" in normalized or "chat/completions" in normalized


def request_image_openai_compatible(
    api_key: str,
    payload: dict[str, object],
    base_url: str,
    timeout_seconds: int,
) -> dict[str, object]:
    try:
        return call_openai_compatible(api_key, payload, base_url, timeout_seconds)
    except urllib.error.HTTPError as exc:
        raise GeminiRequestError(api_error_message(exc)) from exc
    except http.client.RemoteDisconnected as exc:
        reason = "Remote end closed connection without response"
        try:
            return call_openai_compatible_with_curl(api_key, payload, base_url)
        except (GeminiRequestError, RuntimeError, ValueError) as curl_exc:
            message = (
                f"OpenAI-compatible connection failed: {reason}; "
                f"curl fallback failed: {curl_exc}"
            )
            retry_after_seconds = getattr(curl_exc, "retry_after_seconds", None)
            raise GeminiRequestError(message, retry_after_seconds=retry_after_seconds) from curl_exc
    except urllib.error.URLError as exc:
        reason = str(exc.reason)
        try:
            return call_openai_compatible_with_curl(api_key, payload, base_url)
        except (GeminiRequestError, RuntimeError, ValueError) as curl_exc:
            message = (
                f"OpenAI-compatible connection failed: {reason}; "
                f"curl fallback failed: {curl_exc}"
            )
            retry_after_seconds = getattr(curl_exc, "retry_after_seconds", None)
            raise GeminiRequestError(message, retry_after_seconds=retry_after_seconds) from curl_exc


def should_retry_once(message: str) -> bool:
    normalized = message.upper()
    return "429" in normalized or "RESOURCE_EXHAUSTED" in normalized or "TOO MANY REQUESTS" in normalized


def request_image(
    api_key: str,
    model: str,
    payload: dict[str, object],
    openai_payload: dict[str, object],
    base_url: str,
    api_format: str,
    timeout_seconds: int,
) -> dict[str, object]:
    if api_format == "openai":
        return request_image_openai_compatible(api_key, openai_payload, base_url, timeout_seconds)

    try:
        return call_gemini(api_key, model, payload, base_url, timeout_seconds)
    except urllib.error.HTTPError as exc:
        message = api_error_message(exc)
        if api_format == "auto" and should_try_openai_fallback(message, base_url):
            return request_image_openai_compatible(api_key, openai_payload, base_url, timeout_seconds)
        raise GeminiRequestError(message) from exc
    except http.client.RemoteDisconnected as exc:
        reason = "Remote end closed connection without response"
        try:
            return call_gemini_with_curl(api_key, model, payload, base_url)
        except (GeminiRequestError, RuntimeError, ValueError) as curl_exc:
            message = (
                f"Gemini connection failed: {reason}; "
                f"curl fallback failed: {curl_exc}"
            )
            retry_after_seconds = getattr(curl_exc, "retry_after_seconds", None)
            raise GeminiRequestError(message, retry_after_seconds=retry_after_seconds) from curl_exc
    except ConnectionResetError as exc:
        reason = str(exc) or "Connection reset by peer"
        try:
            return call_gemini_with_curl(api_key, model, payload, base_url)
        except (GeminiRequestError, RuntimeError, ValueError) as curl_exc:
            message = (
                f"Gemini connection failed: {reason}; "
                f"curl fallback failed: {curl_exc}"
            )
            retry_after_seconds = getattr(curl_exc, "retry_after_seconds", None)
            raise GeminiRequestError(message, retry_after_seconds=retry_after_seconds) from curl_exc
    except urllib.error.URLError as exc:
        reason = str(exc.reason)
        retryable_transport_errors = (
            "EOF occurred in violation of protocol",
            "Broken pipe",
        )
        if not any(item in reason for item in retryable_transport_errors):
            raise GeminiRequestError(f"Gemini connection failed: {reason}") from exc
        try:
            return call_gemini_with_curl(api_key, model, payload, base_url)
        except (GeminiRequestError, RuntimeError, ValueError) as curl_exc:
            message = (
                f"Gemini connection failed: {reason}; "
                f"curl fallback failed: {curl_exc}"
            )
            retry_after_seconds = getattr(curl_exc, "retry_after_seconds", None)
            raise GeminiRequestError(message, retry_after_seconds=retry_after_seconds) from curl_exc


def request_image_with_retry(
    api_key: str,
    model: str,
    payload: dict[str, object],
    openai_payload: dict[str, object],
    base_url: str,
    api_format: str,
    timeout_seconds: int,
) -> dict[str, object]:
    try:
        return request_image(
            api_key,
            model,
            payload,
            openai_payload,
            base_url,
            api_format,
            timeout_seconds,
        )
    except GeminiRequestError as exc:
        message = str(exc)
        if not should_retry_once(message):
            raise
        wait_seconds = exc.retry_after_seconds or 60.0
        wait_seconds = max(1.0, min(wait_seconds, 120.0))
        print(
            f"Initial image request hit a retryable quota/rate limit. Waiting {wait_seconds:.1f}s before one retry...",
            file=sys.stderr,
        )
        time.sleep(wait_seconds)
        return request_image(
            api_key,
            model,
            payload,
            openai_payload,
            base_url,
            api_format,
            timeout_seconds,
        )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a banner image using the Gemini native API or the Gemini OpenAI-compatible API."
    )
    parser.add_argument("--prompt", required=True, help="Prompt for banner generation")
    parser.add_argument("--output", required=True, help="Where to save the image file")
    parser.add_argument(
        "--api-key",
        help="Explicit API key. Overrides GEMINI_API_KEY and NANO_BANANA_API_KEY.",
    )
    parser.add_argument(
        "--base-url",
        default=os.environ.get("GEMINI_BASE_URL") or os.environ.get("NANO_BANANA_BASE_URL") or DEFAULT_BASE_URL,
        help="API base URL root. Defaults to the fixed gateway root and appends the native or OpenAI-compatible path.",
    )
    parser.add_argument("--width", type=int, default=1536, help="Banner width in pixels")
    parser.add_argument("--height", type=int, default=1024, help="Banner height in pixels")
    parser.add_argument(
        "--timeout",
        type=int,
        default=180,
        help="HTTP timeout in seconds (1-600). Defaults to 180.",
    )
    parser.add_argument("--style", help="Optional visual style label")
    parser.add_argument("--negative-prompt", help="Optional negative prompt")
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Gemini model name. Defaults to {DEFAULT_MODEL}.",
    )
    parser.add_argument(
        "--api-format",
        choices=("openai", "gemini", "auto"),
        default=DEFAULT_API_FORMAT,
        help=(
            "Request format to use. "
            "'openai' uses the fixed /v1beta/openai/chat/completions path, "
            "'gemini' uses the native /v1beta/models/{model}:generateContent path, "
            "and 'auto' tries native first then falls back to OpenAI-compatible."
        ),
    )
    parser.add_argument(
        "--reference",
        action="append",
        help="Optional reference image path. Repeat for multiple files.",
    )
    args = parser.parse_args()

    try:
        validate_dimensions(args.width, args.height)
    except ValueError as exc:
        print(f"Invalid image size: {exc}", file=sys.stderr)
        return 1
    if args.timeout < 1 or args.timeout > 600:
        print("Invalid timeout: must be between 1 and 600 seconds.", file=sys.stderr)
        return 1

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("NANO_BANANA_API_KEY")
    if not api_key:
        print(
            "Missing API key. Use --api-key or set GEMINI_API_KEY / NANO_BANANA_API_KEY.",
            file=sys.stderr,
        )
        return 1

    try:
        payload = build_payload(args)
        openai_payload = build_openai_payload(args)
    except FileNotFoundError as exc:
        print(f"Reference image not found: {exc}", file=sys.stderr)
        return 1

    try:
        response_json = request_image_with_retry(
            api_key,
            args.model,
            payload,
            openai_payload,
            args.base_url,
            args.api_format,
            args.timeout,
        )
        try:
            image_bytes = extract_image_bytes(response_json)
        except ValueError:
            image_bytes = extract_openai_image_bytes(response_json)
    except GeminiRequestError as exc:
        print(f"Gemini request failed: {exc}", file=sys.stderr)
        return 1
    except (json.JSONDecodeError, ValueError, base64.binascii.Error) as exc:
        print(f"Failed to decode Gemini response: {exc}", file=sys.stderr)
        return 1

    output_path = Path(args.output).expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(image_bytes)
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
