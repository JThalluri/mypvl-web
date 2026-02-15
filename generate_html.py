#!/usr/bin/env python3
"""Generate static website pages using Jinja2 templates.

This generator renders the primary site and policy pages into configurable
output targets (build/dist/deploy) using bundled assets and shared branding.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

DEFAULT_CONFIG: dict[str, Any] = {
    "theme": "dark",
    "generate_main_page": True,
    "generate_policy_pages": {
        "privacy_policy": True,
        "cookies_policy": True,
        "terms_of_use": True,
        "dmca_policy": True,
        "thirdparty_attributions": True,
        "contact_us": True,
    },
    "output_targets": {
        "build": False,
        "dist": False,
        "deploy": True,
    },
    "clean_outputs": True,
    "integrations": {
        "recaptcha_enabled": True,
        "tawk_enabled": True,
        "clarity_enabled": True,
    },
}

HOME_SECTIONS: list[str] = [
    "about",
    "features",
    "categories",
    "testimonials",
    "implementations",
    "pricing",
    "contact_us",
]

CONTENT_PAGES: dict[str, dict[str, str]] = {
    "privacy_policy": {
        "title": "Privacy Policy - My PVL Services",
        "description": "Privacy policy for My PVL Services, including collection, usage, and protection of data.",
    },
    "cookies_policy": {
        "title": "Cookie Policy - My PVL Services",
        "description": "Cookie usage policy and controls for My PVL Services.",
    },
    "terms_of_use": {
        "title": "Terms of Use - My PVL Services",
        "description": "Terms and conditions governing use of My PVL Services.",
    },
    "dmca_policy": {
        "title": "DMCA Notice - My PVL Services",
        "description": "DMCA notice and takedown process for My PVL Services.",
    },
    "thirdparty_attributions": {
        "title": "Third-Party Attributions - My PVL Services",
        "description": "Third-party services, libraries, and attribution details used by My PVL Services.",
    },
    "contact_us": {
        "title": "Contact Us - My PVL Services",
        "description": "Contact My PVL Services for demos, support, and collaboration.",
    },
}

TEXT_FIXES: dict[str, str] = {
    "and morse": "and more",
    "visual raio": "visual radio",
    "Sub Sub Category": "Subcategory",
    "Sub sub category": "Subcategory",
    "Artefact options": "Artifact options",
    "standalone html": "standalone HTML",
    "talkshow": "talk show",
}


@dataclass(frozen=True)
class PageContext:
    title: str
    description: str
    body_class: str = ""
    include_recaptcha: bool = False
    theme_color: str = "#F79C19"


def load_config(config_path: Path) -> dict[str, Any]:
    if not config_path.exists():
        config_path.write_text(json.dumps(DEFAULT_CONFIG, indent=2), encoding="utf-8")
        return dict(DEFAULT_CONFIG)

    loaded = json.loads(config_path.read_text(encoding="utf-8"))

    merged = dict(DEFAULT_CONFIG)
    merged.update(
        {
            k: v
            for k, v in loaded.items()
            if k not in {"generate_policy_pages", "output_targets", "integrations"}
        }
    )

    merged["generate_policy_pages"] = dict(DEFAULT_CONFIG["generate_policy_pages"])
    merged["generate_policy_pages"].update(loaded.get("generate_policy_pages", {}))

    merged["output_targets"] = dict(DEFAULT_CONFIG["output_targets"])
    merged["output_targets"].update(loaded.get("output_targets", {}))

    merged["integrations"] = dict(DEFAULT_CONFIG["integrations"])
    merged["integrations"].update(loaded.get("integrations", {}))

    return merged


def read_sections(sections_dir: Path) -> dict[str, str]:
    sections: dict[str, str] = {}

    for section_file in sorted(sections_dir.glob("*.html")):
        key = section_file.stem
        sections[key] = normalize_html(section_file.read_text(encoding="utf-8"))

    return sections


def normalize_html(content: str) -> str:
    for old, new in TEXT_FIXES.items():
        content = content.replace(old, new)

    # Ensure links are relative in generated static outputs.
    content = re.sub(r'(href|src)="/+', r'\1="', content)

    # Add rel attributes for safe new-tab links.
    content = re.sub(
        r'<a([^>]*?)target="_blank"(?![^>]*rel=)([^>]*)>',
        r'<a\1target="_blank" rel="noopener noreferrer"\2>',
        content,
        flags=re.IGNORECASE,
    )

    content = content.replace("{{BANNER_IMAGE}}", "shared/branding/banner.png")
    content = content.replace(
        "{{LOGO_IMAGE}}",
        '<img src="shared/branding/logo.png" alt="My PVL logo" class="logo-img" />',
    )

    return content


def mark_page_active(
    navigation_html: str, footer_html: str, page_file: str
) -> tuple[str, str]:
    nav_pattern = re.compile(
        rf'(href="{re.escape(page_file)}"\s+class=")([^"]*)"',
        flags=re.IGNORECASE,
    )
    footer_pattern = re.compile(
        rf'(href="{re.escape(page_file)}"\s+class=")([^"]*)"',
        flags=re.IGNORECASE,
    )

    def _append_active(match: re.Match[str]) -> str:
        class_list = match.group(2).split()
        if "active" not in class_list:
            class_list.append("active")
        return f'{match.group(1)}{" ".join(class_list)}"'

    def _append_current(match: re.Match[str]) -> str:
        class_list = match.group(2).split()
        if "current-page" not in class_list:
            class_list.append("current-page")
        return f'{match.group(1)}{" ".join(class_list)}"'

    return nav_pattern.sub(_append_active, navigation_html), footer_pattern.sub(
        _append_current, footer_html
    )


def render_site(
    env: Environment,
    config: dict[str, Any],
    sections: dict[str, str],
    target_dir: Path,
) -> None:
    integrations = config["integrations"]
    theme_color = "#F79C19"

    home_template = env.get_template("templates/pages/home.html")
    content_template = env.get_template("templates/pages/content_page.html")

    if config.get("generate_main_page", True):
        home_html = home_template.render(
            page=PageContext(
                title="My PVL - Personal Video Library",
                description=(
                    "Organize, present, and grow your video library with a responsive, searchable, "
                    "mobile-first website experience."
                ),
                body_class="page-home",
                include_recaptcha=bool(integrations["recaptcha_enabled"]),
                theme_color=theme_color,
            ),
            sections=sections,
            home_sections=HOME_SECTIONS,
            integrations=integrations,
        )
        write_html(target_dir / "index.html", home_html)

    for page_name, meta in CONTENT_PAGES.items():
        if not config["generate_policy_pages"].get(page_name, False):
            continue

        nav_html, footer_html = mark_page_active(
            sections["policy_navigation"],
            sections["footer"],
            f"{page_name}.html",
        )

        page_sections = dict(sections)
        page_sections["policy_navigation"] = nav_html
        page_sections["footer"] = footer_html

        html = content_template.render(
            page=PageContext(
                title=meta["title"],
                description=meta["description"],
                body_class=f"page-{page_name}",
                include_recaptcha=bool(
                    integrations["recaptcha_enabled"] and page_name == "contact_us"
                ),
                theme_color=theme_color,
            ),
            sections=page_sections,
            content_section=page_name,
            include_success_modal=(page_name == "contact_us"),
            integrations=integrations,
        )
        write_html(target_dir / f"{page_name}.html", html)


def write_html(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


def copy_static_assets(project_root: Path, target_dir: Path) -> None:
    shared_branding = project_root / "shared" / "branding"
    if shared_branding.exists():
        target_shared = target_dir / "shared"
        target_branding = target_shared / "branding"
        if target_branding.exists():
            shutil.rmtree(target_branding)
        target_branding.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(shared_branding, target_branding)

    manifest = project_root / "manifest.json"
    if manifest.exists():
        shutil.copy2(manifest, target_dir / "manifest.json")

    icons_dir = project_root / "icons"
    if icons_dir.exists():
        target_icons = target_dir / "icons"
        if target_icons.exists():
            shutil.rmtree(target_icons)
        shutil.copytree(icons_dir, target_icons)

    assets_dir = project_root / "assets"
    if assets_dir.exists():
        target_assets = target_dir / "assets"
        if target_assets.exists():
            shutil.rmtree(target_assets)
        shutil.copytree(assets_dir, target_assets)


def prepare_target(target_dir: Path, clean: bool) -> None:
    if clean and target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)


def parse_targets(
    args_targets: list[str] | None, config_targets: dict[str, bool]
) -> list[str]:
    if args_targets:
        return args_targets

    return [name for name, enabled in config_targets.items() if enabled]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate static pages using Jinja2 templates"
    )
    parser.add_argument(
        "--config", default="config.json", help="Path to config JSON file"
    )
    parser.add_argument(
        "--targets",
        nargs="+",
        choices=["build", "dist", "deploy"],
        help="Output targets to generate (default: enabled targets in config)",
    )
    parser.add_argument(
        "--no-clean",
        action="store_true",
        help="Do not clean output targets before generation",
    )
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent
    config = load_config(project_root / args.config)
    targets = parse_targets(args.targets, config["output_targets"])

    if not targets:
        print(
            "No output targets enabled. Set output_targets in config.json or pass --targets."
        )
        return 1

    env = Environment(
        loader=FileSystemLoader(str(project_root)),
        autoescape=select_autoescape(enabled_extensions=("html", "xml")),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    sections = read_sections(project_root / "sections")
    required = {
        "header",
        "navigation",
        "policy_navigation",
        "footer",
        "contact_modal",
        "quick_contact_modal",
        "exit_intent_popup",
        "contact_success_modal",
        "contact_us",
    }
    missing = sorted(required - sections.keys())
    if missing:
        print(f"Missing required section files: {', '.join(missing)}")
        return 1

    for target in targets:
        target_dir = project_root / target
        prepare_target(
            target_dir,
            clean=(not args.no_clean and bool(config.get("clean_outputs", True))),
        )
        render_site(env, config, sections, target_dir)
        copy_static_assets(project_root, target_dir)
        print(f"Generated site output: {target_dir}")

    print("Generation complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
