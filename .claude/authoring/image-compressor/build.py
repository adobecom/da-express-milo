"""
Build script — Image Compressor DA authoring doc (page.docx).

Produces a Milo-doc compatible .docx mirroring the live
/express/feature/image/resize page's 3-variant frictionless hero pattern,
re-themed for image compression and with the new Acom copy.

Run from anywhere:
    python3 /Users/shairilkansal/prx-android/da-express-milo/.claude/authoring/image-compressor/build.py

Outputs:
    .claude/authoring/image-compressor/page.docx

Idempotent — overwrites any existing page.docx.
"""

import os
import sys

# Make .claude/tools importable regardless of cwd.
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TOOLS_DIR = os.path.join(REPO_ROOT, ".claude", "tools")
if TOOLS_DIR not in sys.path:
    sys.path.insert(0, TOOLS_DIR)

from build_milo_doc import (  # noqa: E402
    Document,
    Cm,
    add_block,
    add_section_break,
)

OUT_PATH = os.path.join(os.path.dirname(__file__), "page.docx")

# Upload animation — reuse the same MP4 the live Image Resize page uses
# (/express/feature/image/resize). Grepped from live resize HTML.
UPLOAD_ANIMATION_URL = "https://main--da-express-milo--adobecom.aem.live/media_184ba127fa10e6b95b4bf300c8397d00186227aeb.mp4"
ICON_UPLOAD = "https://main--da-express-milo--adobecom.aem.live/media_169dfd6b66464be4577398508baf6a41c1dd26f6f.png"
ICON_COMPRESS = "https://main--da-express-milo--adobecom.aem.live/media_102940297718a91db18c1dc3a34a429ec0e8263f9.png"
ICON_CONTINUE = "https://main--da-express-milo--adobecom.aem.live/media_176db00d075195774d34896a78eeece1901f2c3e0.png"
IMG_QUICKLY_COMPRESS = "https://main--da-express-milo--adobecom.aem.live/media_16e016e6c2c5c3c98412229258a600db227fa4eab.png"
IMG_STRIKE_BALANCE = "https://main--da-express-milo--adobecom.aem.live/media_120e681af8daed1cf89fb7b6d6c589fd9f8c8a244.png"
IMG_STREAMLINE = "https://main--da-express-milo--adobecom.aem.live/media_111fa92549ca4bc7b00a555f2b9034c1aa43fe154.png"
IMG_CUSTOMIZE = "https://main--da-express-milo--adobecom.aem.live/media_18c3675b239721bd64ab4893729f7bd73ed0506e1.png"

FALLBACK_FRAGMENT = (
    "https://main--da-express-milo--adobecom.aem.live"
    "/express/fragments/mobile-frictionless-qa/fallback-remove-background"
)

TERMS_URL = "https://www.adobe.com/legal/terms.html"
PRIVACY_URL = "https://www.adobe.com/privacy/policy.html"
UPLOAD_CTA_URL = "https://adobesparkpost.app.link/c4bWARQhWAb"
PRICING_URL = "https://www.adobe.com/express/pricing"

# Mobile fork-button-frictionless CTA links (mirrored from live Image Resize page)
FORK_CTA_1_LINK = "https://adobesparkpost.app.link/5pSIOLrnqTb"
FORK_CTA_2_LINK = "https://adobesparkpost-web.app.link/e/00XSYb7H5Hb"

HERO_SUBHEAD = (
    "Easily compress your images in one click using Adobe Express, the quick and "
    "easy create-anything app. Use the online photo compressor to instantly change "
    "the file size of any image to share across your social channels."
)


def build():
    doc = Document()
    for s in doc.sections:
        s.left_margin = s.right_margin = Cm(1.5)
        s.top_margin = s.bottom_margin = Cm(1.5)

    # ----------------------------------------------------------------------
    # Section 1 — Fallback hero (columns fullsize) — fqa-non-qualified
    # ----------------------------------------------------------------------
    add_block(
        doc,
        "columns (fullsize)",
        [
            [
                [
                    ("h", 1, "Free image compressor."),
                    ("p", [("text", HERO_SUBHEAD)]),
                    ("p", [("link", "Upload your photo", UPLOAD_CTA_URL)]),
                ],
                [
                    ("p", [
                        ("link", "Upload animation (MP4)", UPLOAD_ANIMATION_URL),
                    ]),
                ],
            ],
        ],
        col_widths=[3.3, 3.3],
    )
    add_block(
        doc,
        "section-metadata",
        [[[("p", [("text", "showwith")])], [("p", [("text", "fqa-non-qualified")])]]],
        col_widths=[3.3, 3.3],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 2 — Frictionless hero (desktop)
    # ----------------------------------------------------------------------
    add_block(
        doc,
        "frictionless-quick-action",
        [
            # Row 1 (merged across columns in live page shape — author keeps 2 cells,
            # second empty, so we emit 2 cells matching live page HTML).
            [
                [
                    ("h", 1, "Free image compressor."),
                    ("p", [("text", HERO_SUBHEAD)]),
                ],
                [
                    ("p", [("text", "")]),
                ],
            ],
            # Row 2 — upload animation + upload card
            [
                [
                    ("p", [
                        ("link", "Alternate video source (MP4)", UPLOAD_ANIMATION_URL),
                    ]),
                ],
                [
                    ("p", [
                        ("text", "Drag and drop an image"),
                        ("br",),
                        ("text", "or "),
                        ("em", "browse to upload."),
                    ]),
                    ("p", [("link", "Upload your photo", UPLOAD_CTA_URL)]),
                    ("p", [("text", "File must be JPEG, JPG, PNG or WebP and less than 40MB")]),
                    ("p", [
                        ("text", "By uploading your image or video, you agree to the Adobe "),
                        ("link", "Terms of Use", TERMS_URL),
                        ("text", " and "),
                        ("link", "Privacy Policy", PRIVACY_URL),
                    ]),
                ],
            ],
            # Row 3 — Quick-Action key (read by frictionless-quick-action.js:778-782)
            [
                [("p", [("text", "Quick-Action")])],
                [("p", [("text", "compress-image")])],
            ],
        ],
        col_widths=[3.3, 3.3],
    )
    add_block(
        doc,
        "section-metadata",
        [[[("p", [("text", "showwith")])], [("p", [("text", "fqa-qualified-desktop")])]]],
        col_widths=[3.3, 3.3],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 3 — Frictionless hero (mobile)
    # ----------------------------------------------------------------------
    add_block(
        doc,
        "frictionless-quick-action-mobile",
        [
            [
                [
                    ("h", 1, "Free image compressor."),
                    ("p", [("text", HERO_SUBHEAD)]),
                    ("p", [("text", "Do more with your image in Adobe Express.")]),
                ],
                [("p", [("text", "")])],
            ],
            [
                [
                    ("p", [
                        ("link", "Alternate video source (MP4)", UPLOAD_ANIMATION_URL),
                    ]),
                ],
                [
                    ("p", [
                        ("text", "Tap to "),
                        ("em", "upload an image."),
                    ]),
                ],
            ],
            [
                [("p", [("text", "")])],
                [
                    ("p", [("text", "File must be JPEG, JPG, PNG or WebP and less than 40MB")]),
                    ("p", [
                        ("text", "By uploading your image or video, you agree to the Adobe "),
                        ("link", "Terms of Use", TERMS_URL),
                        ("text", " and "),
                        ("link", "Privacy Policy", PRIVACY_URL),
                    ]),
                ],
            ],
            [
                [("p", [("text", "fallback")])],
                [("p", [("link", FALLBACK_FRAGMENT, FALLBACK_FRAGMENT)])],
            ],
            [
                [("p", [("text", "Quick-Action")])],
                [("p", [("text", "compress-image")])],
            ],
        ],
        col_widths=[3.3, 3.3],
    )
    add_block(
        doc,
        "section-metadata",
        [[[("p", [("text", "showwith")])], [("p", [("text", "fqa-qualified-mobile")])]]],
        col_widths=[3.3, 3.3],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 4 — How-to-3-step strip
    # ----------------------------------------------------------------------
    # Section heading (lives outside the block) — Milo docs surface bare h2s
    # as top-level paragraphs. Rendered as a full-width heading paragraph.
    h2p = doc.add_paragraph()
    h2run = h2p.add_run("How to compress a JPEG.")
    h2run.bold = True

    add_block(
        doc,
        "steps (highlight, image, schema)",
        [
            [
                [("img", ICON_UPLOAD, "Icon: Upload")],
                [
                    ("h", 3, "1. Select"),
                    ("p", [("text", "Upload your image to our image compressor tool.")]),
                ],
            ],
            [
                [("img", ICON_COMPRESS, "Icon: Compress")],
                [
                    ("h", 3, "2. Compress."),
                    ("p", [("text",
                        "Either upload a JPEG from your device or access an image in Adobe Express. "
                        "Use the slider to compress the JPEG down from 100 percent to 0 percent. "
                        "The add-on will reflect, in real time, the size of the compressed image.")]),
                ],
            ],
            [
                [("img", ICON_CONTINUE, "Icon: Continue editing")],
                [
                    ("h", 3, "3. Continue editing."),
                    ("p", [("text",
                        "Click Add to page or Download when you've got a JPEG size that works for your project. "
                        "Keep editing your image in Adobe Express by applying filters, cropping, and more.")]),
                ],
            ],
        ],
        col_widths=[2.0, 4.6],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 5 — 4 content columns blocks
    # ----------------------------------------------------------------------
    # Block 1 — image left / text right
    add_block(
        doc,
        "columns",
        [
            [
                [("img", IMG_QUICKLY_COMPRESS, "Image of a JPEG being compressed in Adobe Express.")],
                [
                    ("h", 2, "Quickly compress any image."),
                    ("p", [("text",
                        "If you're compressing an image for the homepage of your blog or so you can text your "
                        "vacation photos to the friend chat in bulk, you want to be able to use your photos "
                        "right away. Just upload your image into the image compressor, then use the slider "
                        "tool to pick the ideal file size.")]),
                ],
            ],
        ],
        col_widths=[3.3, 3.3],
    )

    # Block 2 — text left / image right
    add_block(
        doc,
        "columns",
        [
            [
                [
                    ("h", 2, "Strike the ideal balance."),
                    ("p", [("text",
                        "Customize the level of compression you need for your JPEG with the easy-to-use "
                        "slider. Compress just a little to maintain the highest image quality or a lot "
                        "if you're looking to save space in your digital storage of choice.")]),
                ],
                [("img", IMG_STRIKE_BALANCE, "Slider UI illustrating compression levels.")],
            ],
        ],
        col_widths=[3.3, 3.3],
    )

    # Block 3 — image left / text right
    add_block(
        doc,
        "columns",
        [
            [
                [("img", IMG_STREAMLINE, "Magazine collage showing designs made in Adobe Express.")],
                [
                    ("h", 2, "Streamline your workflow."),
                    ("p", [("text",
                        "Compress your JPEGs in one place in Adobe Express. You can even use images you're "
                        "working within the Adobe Express editor without needing to download first. "
                        "Finalize designs faster when you're not switching between programs for different "
                        "tasks. Click Add to page to keep editing or download the new JPEG.")]),
                ],
            ],
        ],
        col_widths=[3.3, 3.3],
    )

    # Block 4 — text left / large illustration right
    add_block(
        doc,
        "columns",
        [
            [
                [
                    ("h", 2, "Customize your photo online with the compression tool, templates, and more."),
                    ("p", [("text",
                        "Adobe Express makes editing and using images easy. Take time to explore the image "
                        "editing options among an array of others to develop your style. With Adobe Express "
                        "on your side, all you need to do is open the app to create unique and standout "
                        "designs that will captivate your audience.")]),
                ],
                [("img", IMG_CUSTOMIZE, "Collage of Adobe Express templates and editing surfaces.")],
            ],
        ],
        col_widths=[3.3, 3.3],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 6 — Discover even more (link-list)
    # ----------------------------------------------------------------------
    add_block(
        doc,
        "link-list",
        [
            [[
                ("h", 3, "Discover even more."),
                ("p", [("link", "Remove Background", "https://www.adobe.com/express/feature/image/remove-background")]),
                ("p", [("link", "Blur Background", "https://www.adobe.com/express/feature/image/blur-background")]),
                ("p", [("link", "Convert Image File", "https://www.adobe.com/express/feature/image/convert/jpg-to-png")]),
                ("p", [("link", "Photo Effect", "https://www.adobe.com/express/feature/image/effect")]),
                ("p", [("link", "Enhance Image", "https://www.adobe.com/express/feature/image/enhance")]),
                ("p", [("link", "Video Editor/Maker", "https://www.adobe.com/express/create/video")]),
            ]],
        ],
        col_widths=[6.6],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 7 — Purple promo band (banner, default variant, heading only)
    # ----------------------------------------------------------------------
    add_block(
        doc,
        "banner",
        [
            [[("h", 2, "Easily compress JPEGs with Adobe Express.")]],
        ],
        col_widths=[6.6],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 8 — FAQ
    # (Previous sticky-promo-bar section removed — the strip referenced the
    # deprecated HARMAN add-on and is no longer applicable under the frictionless flow.)
    # ----------------------------------------------------------------------
    faqp = doc.add_paragraph()
    faqrun = faqp.add_run("Frequently asked questions.")
    faqrun.bold = True

    add_block(
        doc,
        "faq",
        [
            [
                [("p", [("text", "How do I compress JPEGs in Adobe Express?")])],
                [("p", [("text",
                    "Upload a JPEG, JPG, PNG, or WebP file (up to 40MB) to the image "
                    "compressor above. Use the slider to choose your compression level, "
                    "then Download or Open in Adobe Express to keep editing.")])],
            ],
            [
                [("p", [("text", "What files are supported by the image compressor?")])],
                [("p", [("text",
                    "JPEG, JPG, PNG, and WebP images can be compressed with the image "
                    "compressor. The compressed image will be converted to your chosen "
                    "format on download. You can also open the compressed image in the "
                    "Adobe Express editor for more editing options.")])],
            ],
            [
                [("p", [("text", "Will compressing an image reduce its quality?")])],
                [("p", [("text",
                    "Compression may reduce quality, especially at higher compression levels. "
                    "Use the slider to adjust the compression and find a good balance between "
                    "file size and visual quality.")])],
            ],
            [
                [("p", [("text", "Can I get Adobe Express for free? If so, what’s included?")])],
                [("p", [
                    ("text",
                        "Yes, Adobe Express has a free plan that includes core features like photo "
                        "editing tools and effects and thousands of free templates. Learn more about "
                        "our "),
                    ("link", "plans and pricing", PRICING_URL),
                    ("text", "."),
                ])],
            ],
        ],
        col_widths=[3.3, 3.3],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 10 — Breadcrumbs
    # ----------------------------------------------------------------------
    add_block(
        doc,
        "breadcrumbs",
        [
            [[
                ("p", [("link", "Home", "https://www.adobe.com/express")]),
                ("p", [("link", "Feature", "https://www.adobe.com/express/feature")]),
                ("p", [("text", "Image Compressor")]),
            ]],
        ],
        col_widths=[6.6],
    )
    add_section_break(doc)

    # ----------------------------------------------------------------------
    # Section 11 — Page metadata
    # ----------------------------------------------------------------------
    add_block(
        doc,
        "metadata",
        [
            [[("p", [("text", "Title")])], [("p", [("text", "Free image compressor | Adobe Express")])]],
            [[("p", [("text", "Description")])], [("p", [("text",
                "Easily compress your images in one click using Adobe Express. Use the online "
                "photo compressor to instantly change the file size of any image to share across "
                "your social channels.")])]],
            [[("p", [("text", "Short Title")])], [("p", [("text", "Image Compressor")])]],
            [[("p", [("text", "show-floating-cta")])], [("p", [("text", "yes")])]],
            [[("p", [("text", "desktop-floating-cta")])], [("p", [("text", "floating-button")])]],
            [[("p", [("text", "mobile-floating-cta")])], [("p", [("text", "mobile-fork-button-frictionless")])]],
            [[("p", [("text", "frictionless-safari")])], [("p", [("text", "on")])]],
            [[("p", [("text", "main-cta-link")])], [("p", [("link", UPLOAD_CTA_URL, UPLOAD_CTA_URL)])]],
            [[("p", [("text", "fork-cta-1-icon")])], [("p", [("text", "cc-express")])]],
            [[("p", [("text", "fork-cta-1-icon-text")])], [("p", [("text", "Adobe Express")])]],
            [[("p", [("text", "fork-cta-1-text")])], [("p", [("text", "Get free app")])]],
            [[("p", [("text", "fork-cta-1-link")])], [("p", [("link", FORK_CTA_1_LINK, FORK_CTA_1_LINK)])]],
            [[("p", [("text", "fork-cta-2-icon")])], [("p", [("text", "SX_GlobeGrid_18_N")])]],
            [[("p", [("text", "fork-cta-2-icon-text")])], [("p", [("text", "Web version")])]],
            [[("p", [("text", "fork-cta-2-text")])], [("p", [("text", "Continue")])]],
            [[("p", [("text", "fork-cta-2-link")])], [("p", [("link", FORK_CTA_2_LINK, FORK_CTA_2_LINK)])]],
            [[("p", [("text", "fork-cta-2-link-frictionless")])], [("p", [("text", "#mobile-fqa-upload")])]],
            [[("p", [("text", "fork-cta-2-text-frictionless")])], [("p", [("text", "Upload photo")])]],
            [[("p", [("text", "breadcrumbs")])], [("p", [("text", "n/a")])]],
            [[("p", [("text", "breadcrumbs-from-url")])], [("p", [("text", "off")])]],
            [[("p", [("text", "breadcrumbs-hidden-entries")])], [("p", [("text", "image,video,design")])]],
            [[("p", [("text", "quickaction-upload-page")])], [("p", [("text", "on")])]],
            [[("p", [("text", "theme")])], [("p", [("text", "No Brand Header")])]],
            [[("p", [("text", "show-free-plan")])], [("p", [("text", "yes")])]],
            [[("p", [("text", "marquee-inject-logo")])], [("p", [("text", "yes")])]],
        ],
        col_widths=[3.3, 3.3],
    )

    doc.save(OUT_PATH)
    size = os.path.getsize(OUT_PATH)
    print(f"Wrote {OUT_PATH} ({size} bytes)")


if __name__ == "__main__":
    build()
