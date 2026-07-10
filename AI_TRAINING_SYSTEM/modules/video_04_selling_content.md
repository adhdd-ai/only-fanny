MODULE: Selling Content with Our System

STATES:
- SCRIPT_SELECTION
- MESSAGE_COMPOSITION
- PRE_SEND_VALIDATION
- SCRIPT_EXECUTION
- PPV_VERIFICATION

OBJECTIVE:
Execute scripted content sales efficiently while avoiding duplicate sends and maintaining authentic communication.

---

BEHAVIOUR RULES:
- Always check messages before sending (verify auto-filled names)
- Go through scripts sequentially (1→2→3→4→5→6)
- Never send content without a caption
- Double-check PPV stats before sending any content
- Use countdown timer for timed content (e.g., 2-minute videos)
- Send certain messages together when indicated (e.g., 1S5 + 1S6)
- Wait for fan response between designated script steps
- Note down any skipped scripts with reason
- Triple-check to prevent duplicate sends

---

DECISION LOGIC:

IF sending scripted content:
→ Verify fan hasn't received it already (check PPV stats)
→ Check shortcuts for send/bought status
→ Attach content via shortcuts (1S, 1S2, etc.)
→ Verify name auto-filled correctly
→ Add appropriate caption
→ Send

IF message has price attached:
→ Can adjust price manually if needed
→ Can delete price if needed

IF script indicates "send together":
→ Send both messages simultaneously
→ Example: 1S5 and 1S6 together

IF script indicates "wait for response":
→ Pause and wait for fan reply
→ Continue only after response received

IF fan has specific preference (e.g., likes leggings):
→ Can skip to relevant script (e.g., Script 2)
→ MUST note down: "Skipped Script 1 because fan likes leggings"
→ Notify supervisor of skip

IF content has duration (e.g., 2-minute video):
→ Set countdown timer
→ Continue other chats while waiting
→ Return and send when timer completes

IF fan already received content:
→ Check via: PPV stats, shortcuts, vault/gallery
→ Do NOT send duplicate
→ Move to next appropriate content

---

EXECUTION FLOW:

1. Check PPV stats (0/0 = never sent, safe to send)
2. Verify via shortcuts (shows sent/bought status)
3. Select appropriate script/shortcut
4. Attach content and price
5. VALIDATE: Check name auto-filled correctly
6. Add authentic caption
7. Send
8. For timed content: Set countdown, wait, send follow-up
9. Note any skips or special circumstances

---

TECHNIQUES:

Shortcut System:
1S = Script 1, first message
1S2 = Script 1, second message
1S5+1S6 = Send together

Verification Triple-Check:
- Check PPV stats
- Check shortcut status
- Check vault/gallery

Timing with Countdown:
- Attach content with timer
- Work other chats
- Audio alert when ready
- Send follow-up content

---

CONVERSATION FLOWS:

Normal Script Flow:
1S → wait → 1S2 → wait → 1S3 → wait → etc.

Bundled Messages:
1S5 + 1S6 (send together) → wait → 1S7

Timed Content:
Attach 2-min video → Set countdown → Continue working → Hear alert → Send next message

---

EDGE CASES:

Case: Name didn't auto-fill
→ Manually add name before sending
→ Never send without checking

Case: Fan says they like specific content type
→ Can skip to relevant script
→ Must document skip reason
→ Must inform supervisor

Case: PPV stats unclear or buggy
→ Check vault/gallery as backup
→ When in doubt, don't send

Case: Want to sell outside script (advanced)
→ Attach content manually via "+" button
→ Add price manually
→ Add caption
→ Only for experienced chatters

---

FAIL CONDITIONS:

- Sending duplicate content
- Sending without caption
- Not checking name auto-fill
- Skipping scripts without noting
- Sending content fan already bought
- Not waiting for responses between steps
- Forgetting countdown timing

---

CRITICAL NOTES:

- Everything sent is YOUR responsibility — check thoroughly
- Shortcuts may have technical issues — always verify
- Creator Hero may be buggy — use multiple verification methods
- Never send "nudes" or content without context/caption
- Manual selling (outside scripts) is advanced — requires experience
