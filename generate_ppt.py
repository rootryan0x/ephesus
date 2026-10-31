"""
Generates the official 5-slide PowerPoint presentation for Ephesus Hostel Management System
following the Smart India Hackathon (SIH) format and guidelines.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank slide layout

    # Color Palette
    C_DARK_BG = RGBColor(15, 23, 42)       # Slate 900
    C_WHITE = RGBColor(255, 255, 255)
    C_PRIMARY_BLUE = RGBColor(37, 99, 235)  # Blue 600
    C_LIGHT_BG = RGBColor(248, 250, 252)   # Slate 50
    C_CARD_BG = RGBColor(255, 255, 255)
    C_CARD_BORDER = RGBColor(226, 232, 240)
    C_TEXT_DARK = RGBColor(15, 23, 42)
    C_TEXT_MUTED = RGBColor(100, 116, 139)
    C_ACCENT_ORANGE = RGBColor(217, 119, 6)
    C_ACCENT_GREEN = RGBColor(16, 185, 129)
    C_ACCENT_PURPLE = RGBColor(124, 58, 237)

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide (Dark Theme for Maximum Impact)
    # -------------------------------------------------------------
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_DARK_BG
    bg1.line.color.rgb = C_DARK_BG

    # Category / Event Tag
    tb = slide1.shapes.add_textbox(Inches(1.0), Inches(1.0), Inches(11.333), Inches(0.5))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "SMART INDIA HACKATHON • PROVIDENCE COLLEGE OF ENGINEERING"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(148, 163, 184)

    # Main Project Title
    tb_title = slide1.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(1.6))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = "Ephesus Hostel Management System"
    p_title.font.size = Pt(40)
    p_title.font.bold = True
    p_title.font.color.rgb = C_WHITE

    # Tagline
    tb_tag = slide1.shapes.add_textbox(Inches(1.0), Inches(3.2), Inches(11.333), Inches(0.8))
    tf_tag = tb_tag.text_frame
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = "Zero Paper. Zero Guesswork. Total Accountability."
    p_tag.font.size = Pt(22)
    p_tag.font.bold = True
    p_tag.font.color.rgb = RGBColor(56, 189, 248) # Cyan 400

    # Team Card Container
    team_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.3), Inches(11.333), Inches(2.2))
    team_card.fill.solid()
    team_card.fill.fore_color.rgb = RGBColor(30, 41, 59)
    team_card.line.color.rgb = RGBColor(51, 65, 85)

    tb_team_hdr = slide1.shapes.add_textbox(Inches(1.3), Inches(4.5), Inches(10.7), Inches(0.4))
    p_th = tb_team_hdr.text_frame.paragraphs[0]
    p_th.text = "TEAM MEMBERS"
    p_th.font.size = Pt(12)
    p_th.font.bold = True
    p_th.font.color.rgb = RGBColor(148, 163, 184)

    # 4 Team member columns
    col_width = 2.6
    members = [
        ("Team Leader", "[Leader Name]"),
        ("Member 1", "[Member 1 Name]"),
        ("Member 2", "[Member 2 Name]"),
        ("Member 3", "[Member 3 Name]")
    ]
    for idx, (role, name) in enumerate(members):
        left_pos = 1.3 + (idx * col_width)
        box = slide1.shapes.add_textbox(Inches(left_pos), Inches(5.0), Inches(col_width - 0.2), Inches(1.2))
        tf_m = box.text_frame
        p_role = tf_m.paragraphs[0]
        p_role.text = role.upper()
        p_role.font.size = Pt(11)
        p_role.font.bold = True
        p_role.font.color.rgb = RGBColor(56, 189, 248)

        p_name = tf_m.add_paragraph()
        p_name.text = name
        p_name.font.size = Pt(14)
        p_name.font.bold = True
        p_name.font.color.rgb = C_WHITE

    # -------------------------------------------------------------
    # Helper to add standardized top header to content slides
    # -------------------------------------------------------------
    def add_slide_header(slide, title_text, slide_num):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_LIGHT_BG
        bg.line.color.rgb = C_LIGHT_BG

        # Banner bar
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(1.1))
        bar.fill.solid()
        bar.fill.fore_color.rgb = C_DARK_BG
        bar.line.color.rgb = C_DARK_BG

        tb_h = slide.shapes.add_textbox(Inches(0.8), Inches(0.15), Inches(9.0), Inches(0.8))
        tf_h = tb_h.text_frame
        p_cat = tf_h.paragraphs[0]
        p_cat.text = "SMART INDIA HACKATHON • EPHESUS HOSTEL MANAGEMENT SYSTEM"
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = RGBColor(148, 163, 184)

        p_main = tf_h.add_paragraph()
        p_main.text = title_text
        p_main.font.size = Pt(22)
        p_main.font.bold = True
        p_main.font.color.rgb = C_WHITE

        # Slide number
        tb_num = slide.shapes.add_textbox(Inches(11.5), Inches(0.3), Inches(1.0), Inches(0.5))
        p_num = tb_num.text_frame.paragraphs[0]
        p_num.text = f"{slide_num}"
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.font.size = Pt(20)
        p_num.font.bold = True
        p_num.font.color.rgb = RGBColor(148, 163, 184)

    # -------------------------------------------------------------
    # SLIDE 2: Problem & Objectives
    # -------------------------------------------------------------
    slide2 = prs.slides.add_slide(blank_layout)
    add_slide_header(slide2, "Problem & Objectives", 2)

    # Left Column: Problem & Proposed Solution
    card_prob = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.6), Inches(2.6))
    card_prob.fill.solid()
    card_prob.fill.fore_color.rgb = C_CARD_BG
    card_prob.line.color.rgb = RGBColor(254, 202, 202) # Light red border

    tb_prob = slide2.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(5.2), Inches(2.3))
    tf_p = tb_prob.text_frame
    tf_p.word_wrap = True
    p1 = tf_p.paragraphs[0]
    p1.text = "PROBLEM STATEMENT"
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(220, 38, 38)

    p2 = tf_p.add_paragraph()
    p2.text = "Paper logbooks cause widespread proxy sign-outs, leave wardens with zero real-time visibility during curfews, and lead to heavy weekend mess food wastage due to unpredictable headcounts."
    p2.font.size = Pt(13)
    p2.font.color.rgb = C_TEXT_DARK
    p2.space_before = Pt(8)

    # Proposed Solution Card
    card_sol = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.3), Inches(5.6), Inches(2.6))
    card_sol.fill.solid()
    card_sol.fill.fore_color.rgb = C_CARD_BG
    card_sol.line.color.rgb = RGBColor(191, 219, 254) # Light blue border

    tb_sol = slide2.shapes.add_textbox(Inches(1.0), Inches(4.4), Inches(5.2), Inches(2.3))
    tf_s = tb_sol.text_frame
    tf_s.word_wrap = True
    p_s1 = tf_s.paragraphs[0]
    p_s1.text = "PROPOSED SOLUTION"
    p_s1.font.size = Pt(12)
    p_s1.font.bold = True
    p_s1.font.color.rgb = C_PRIMARY_BLUE

    p_s2 = tf_s.add_paragraph()
    p_s2.text = "A zero-hardware hostel platform using rotating dynamic QR codes for proxy-free gate movement, automated curfew auditing, and predictive mess population planning."
    p_s2.font.size = Pt(13)
    p_s2.font.color.rgb = C_TEXT_DARK
    p_s2.space_before = Pt(8)

    # Right Column: Objectives (1, 2, 3)
    card_obj = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.7), Inches(1.4), Inches(5.8), Inches(5.5))
    card_obj.fill.solid()
    card_obj.fill.fore_color.rgb = C_CARD_BG
    card_obj.line.color.rgb = C_CARD_BORDER

    tb_obj_hdr = slide2.shapes.add_textbox(Inches(7.0), Inches(1.6), Inches(5.2), Inches(0.4))
    p_oh = tb_obj_hdr.text_frame.paragraphs[0]
    p_oh.text = "KEY OBJECTIVES"
    p_oh.font.size = Pt(13)
    p_oh.font.bold = True
    p_oh.font.color.rgb = C_PRIMARY_BLUE

    objectives = [
        ("1", "Eliminate Proxy Sign-Outs", "Replace physical sign-out books with 20-second auto-rotating dynamic QR codes, preventing pass sharing and signature fraud."),
        ("2", "Automate Curfew Auditing", "Silently audit student movements against curfew limits via autonomous background workers, triggering instant 1-click calls for overdue students."),
        ("3", "Predictive Mess Sustainability", "Collect Sunday return confirmations before the kitchen deadline to project exact dinner headcounts, eliminating weekend food waste.")
    ]

    for idx, (num, title, desc) in enumerate(objectives):
        top_pos = 2.2 + (idx * 1.55)
        # Number badge
        badge = slide2.shapes.add_shape(MSO_SHAPE.OVAL, Inches(7.0), Inches(top_pos), Inches(0.55), Inches(0.55))
        badge.fill.solid()
        badge.fill.fore_color.rgb = C_PRIMARY_BLUE
        badge.line.color.rgb = C_PRIMARY_BLUE
        p_b = badge.text_frame.paragraphs[0]
        p_b.text = num
        p_b.alignment = PP_ALIGN.CENTER
        p_b.font.size = Pt(14)
        p_b.font.bold = True
        p_b.font.color.rgb = C_WHITE

        # Text
        tb_o = slide2.shapes.add_textbox(Inches(7.7), Inches(top_pos - 0.1), Inches(4.6), Inches(1.4))
        tf_o = tb_o.text_frame
        tf_o.word_wrap = True
        p_ot = tf_o.paragraphs[0]
        p_ot.text = title
        p_ot.font.size = Pt(13)
        p_ot.font.bold = True
        p_ot.font.color.rgb = C_TEXT_DARK

        p_od = tf_o.add_paragraph()
        p_od.text = desc
        p_od.font.size = Pt(11)
        p_od.font.color.rgb = C_TEXT_MUTED
        p_od.space_before = Pt(3)

    # -------------------------------------------------------------
    # SLIDE 3: Impact & Importance
    # -------------------------------------------------------------
    slide3 = prs.slides.add_slide(blank_layout)
    add_slide_header(slide3, "Impact & Importance", 3)

    col_w3 = 3.65
    gap3 = 0.3
    # 3 equal cards across
    # Column 1: Target Beneficiaries
    c1 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(col_w3), Inches(5.5))
    c1.fill.solid()
    c1.fill.fore_color.rgb = C_CARD_BG
    c1.line.color.rgb = C_CARD_BORDER

    tb1 = slide3.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(col_w3 - 0.4), Inches(5.1))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "TARGET BENEFICIARIES"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_PRIMARY_BLUE

    items_ben = [
        ("Students", "Instant 5-second contactless check-in/out and paperless outpass requests right from their phone."),
        ("Wardens", "Live 30-room occupancy grid and instant 1-click overdue student calls without manual roll calls."),
        ("College & Parents", "Complete transparency on student safety and massive reduction in campus mess food expenditure.")
    ]
    for title, desc in items_ben:
        p_t = tf1.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.bold = True
        p_t.font.size = Pt(12)
        p_t.font.color.rgb = C_TEXT_DARK
        p_t.space_before = Pt(10)

        p_d = tf1.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = C_TEXT_MUTED

    # Column 2: Why Solution Needed
    c2 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + col_w3 + gap3), Inches(1.4), Inches(col_w3), Inches(5.5))
    c2.fill.solid()
    c2.fill.fore_color.rgb = C_CARD_BG
    c2.line.color.rgb = C_CARD_BORDER

    tb2 = slide3.shapes.add_textbox(Inches(1.0 + col_w3 + gap3), Inches(1.6), Inches(col_w3 - 0.4), Inches(5.1))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "WHY IT IS NEEDED"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_ACCENT_ORANGE

    items_why = [
        ("Hardware Cost & Bottlenecks", "Biometric turnstiles and RFID cards are expensive, break easily, and cause massive queues during peak college rush hours."),
        ("Paper Register Loopholes", "Paper logbooks allow forged signatures, friend proxy sign-ins, and zero accountability for late returns."),
        ("Blind Weekend Cooking", "Hostel kitchens routinely over-prepare meals on weekends without confirmed resident counts, wasting kilograms of food.")
    ]
    for title, desc in items_why:
        p_t = tf2.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.bold = True
        p_t.font.size = Pt(12)
        p_t.font.color.rgb = C_TEXT_DARK
        p_t.space_before = Pt(10)

        p_d = tf2.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = C_TEXT_MUTED

    # Column 3: Real-World Impact
    c3 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + (col_w3 * 2) + (gap3 * 2)), Inches(1.4), Inches(col_w3), Inches(5.5))
    c3.fill.solid()
    c3.fill.fore_color.rgb = C_CARD_BG
    c3.line.color.rgb = C_CARD_BORDER

    tb3 = slide3.shapes.add_textbox(Inches(1.0 + (col_w3 * 2) + (gap3 * 2)), Inches(1.6), Inches(col_w3 - 0.4), Inches(5.1))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    p = tf3.paragraphs[0]
    p.text = "REAL-WORLD IMPACT"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_ACCENT_GREEN

    items_imp = [
        ("100% Proxy Elimination", "Time-stamped, short-lived cryptographic tokens completely eradicate attendance manipulation."),
        ("Up to 80% Less Food Waste", "Tying kitchen grocery prep directly to Sunday confirmed return intentions prevents wasted food."),
        ("Zero-Effort Curfew Tracking", "Server background worker detects overdue students immediately, eliminating tedious manual room inspections.")
    ]
    for title, desc in items_imp:
        p_t = tf3.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.bold = True
        p_t.font.size = Pt(12)
        p_t.font.color.rgb = C_TEXT_DARK
        p_t.space_before = Pt(10)

        p_d = tf3.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = C_TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 4: Innovation & Solution
    # -------------------------------------------------------------
    slide4 = prs.slides.add_slide(blank_layout)
    add_slide_header(slide4, "Innovation & Solution", 4)

    # 3 Columns
    # Column 1: Novelty / Unique Features
    c4_1 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(3.7), Inches(5.5))
    c4_1.fill.solid()
    c4_1.fill.fore_color.rgb = C_CARD_BG
    c4_1.line.color.rgb = C_CARD_BORDER

    tb4_1 = slide4.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(3.3), Inches(5.1))
    tf4_1 = tb4_1.text_frame
    tf4_1.word_wrap = True
    p = tf4_1.paragraphs[0]
    p.text = "NOVELTY & FEATURES"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_PRIMARY_BLUE

    features = [
        ("Anti-Proxy Dynamic QR", "Token auto-rotates every 20 seconds. Screenshots and shared images fail verification."),
        ("Autonomous Curfew Worker", "Background cron worker audits movements against curfew every 60s, flagging overdue students."),
        ("Sunday Return Protocol", "Automated confirmation mechanism linking return status to mess headcount."),
        ("Cyber-Glass Command HUD", "Live 30-room interactive grid with visual occupancy and 1-click Dark/Light themes.")
    ]
    for title, desc in features:
        p_t = tf4_1.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.bold = True
        p_t.font.size = Pt(11.5)
        p_t.font.color.rgb = C_TEXT_DARK
        p_t.space_before = Pt(8)

        p_d = tf4_1.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = C_TEXT_MUTED

    # Column 2: Tech Stack
    c4_2 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.8), Inches(1.4), Inches(3.7), Inches(5.5))
    c4_2.fill.solid()
    c4_2.fill.fore_color.rgb = C_CARD_BG
    c4_2.line.color.rgb = C_CARD_BORDER

    tb4_2 = slide4.shapes.add_textbox(Inches(5.0), Inches(1.6), Inches(3.3), Inches(5.1))
    tf4_2 = tb4_2.text_frame
    tf4_2.word_wrap = True
    p = tf4_2.paragraphs[0]
    p.text = "TECH STACK"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_ACCENT_PURPLE

    tech_stack = [
        ("Frontend", "React 19, Vite, HTML5-QRCode (native camera scanning), Lucide Icons, Cyber-Glass CSS"),
        ("Backend", "Node.js, Express.js REST API, JWT Authentication, Autonomous Background Cron Worker"),
        ("Database", "SQLite (better-sqlite3) with transactional ACID data safety"),
        ("Architecture", "Zero extra hardware required — runs seamlessly across smartphones and laptops")
    ]
    for title, desc in tech_stack:
        p_t = tf4_2.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.bold = True
        p_t.font.size = Pt(11.5)
        p_t.font.color.rgb = C_TEXT_DARK
        p_t.space_before = Pt(8)

        p_d = tf4_2.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = C_TEXT_MUTED

    # Column 3: Challenges Faced & Fixes
    c4_3 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.8), Inches(1.4), Inches(3.7), Inches(5.5))
    c4_3.fill.solid()
    c4_3.fill.fore_color.rgb = C_CARD_BG
    c4_3.line.color.rgb = C_CARD_BORDER

    tb4_3 = slide4.shapes.add_textbox(Inches(9.0), Inches(1.6), Inches(3.3), Inches(5.1))
    tf4_3 = tb4_3.text_frame
    tf4_3.word_wrap = True
    p = tf4_3.paragraphs[0]
    p.text = "CHALLENGES & FIXES"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_ACCENT_ORANGE

    challenges = [
        ("Proxy QR Sharing", "Fix: Short-lived 20s cryptographic rotating tokens that expire immediately."),
        ("Friday Route Collision", "Fix: Dual-route workflow enabling direct College-to-Home departure."),
        ("Manual Curfew Overhead", "Fix: Autonomous server-side audit worker comparing movement logs every 60s.")
    ]
    for title, desc in challenges:
        p_t = tf4_3.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.bold = True
        p_t.font.size = Pt(11.5)
        p_t.font.color.rgb = C_TEXT_DARK
        p_t.space_before = Pt(10)

        p_d = tf4_3.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = C_TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 5: Live Demonstration Workflow
    # -------------------------------------------------------------
    slide5 = prs.slides.add_slide(blank_layout)
    add_slide_header(slide5, "Live Demonstration Workflow", 5)

    demo_steps = [
        ("STEP 1", "Warden QR Broadcast", "Warden selects movement session (College OUT/IN, Outpass, Leave) and projects the dynamic rotating QR code on screen.", C_PRIMARY_BLUE),
        ("STEP 2", "Student Mobile Scan", "Student opens portal on smartphone camera, points at warden screen, and verifies movement in seconds with live receipts.", C_ACCENT_PURPLE),
        ("STEP 3", "Real-Time Room Sync", "Warden command center room grid and campus stats update instantaneously without manual page refreshes.", C_ACCENT_GREEN),
        ("STEP 4", "Autonomous Curfew Alert", "System auto-flags expired passes as OVERDUE, alerting the warden with a 1-click 'Call Student' direct action.", RGBColor(220, 38, 38))
    ]

    card_w5 = 2.7
    gap5 = 0.22
    for idx, (step_tag, title, desc, accent_color) in enumerate(demo_steps):
        left_pos = 0.8 + (idx * (card_w5 + gap5))
        c5 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left_pos), Inches(1.6), Inches(card_w5), Inches(5.1))
        c5.fill.solid()
        c5.fill.fore_color.rgb = C_CARD_BG
        c5.line.color.rgb = C_CARD_BORDER

        # Step tag header box
        tag_box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left_pos + 0.2), Inches(1.9), Inches(card_w5 - 0.4), Inches(0.45))
        tag_box.fill.solid()
        tag_box.fill.fore_color.rgb = accent_color
        tag_box.line.color.rgb = accent_color
        p_tag = tag_box.text_frame.paragraphs[0]
        p_tag.text = step_tag
        p_tag.alignment = PP_ALIGN.CENTER
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = C_WHITE

        tb5 = slide5.shapes.add_textbox(Inches(left_pos + 0.2), Inches(2.6), Inches(card_w5 - 0.4), Inches(3.8))
        tf5 = tb5.text_frame
        tf5.word_wrap = True
        p_t = tf5.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = C_TEXT_DARK

        p_d = tf5.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = C_TEXT_MUTED
        p_d.space_before = Pt(10)

    # Save presentation
    output_path = "/Users/ryan/Downloads/Ephesus Hostel/Ephesus_Hostel_Presentation.pptx"
    prs.save(output_path)
    print(f"✓ Presentation saved successfully to: {output_path}")

if __name__ == '__main__':
    create_presentation()
