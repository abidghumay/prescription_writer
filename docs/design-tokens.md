# Design Tokens

These tokens define the core visual language for the prescription writer app, designed for a calm, clinical, and fast user experience.

## Colors

- **Background**: `hsl(0, 0%, 100%)` (White for clarity and high contrast)
- **Foreground (Text)**: `hsl(222.2, 84%, 4.9%)` (Very dark blue/gray for readability)
- **Accent/Primary**: `hsl(200, 70%, 40%)` (Calm Teal/Blue - #1f8bba)
- **Primary Foreground**: `hsl(210, 40%, 98%)` (Off-white for text on primary buttons)
- **Muted (Secondary/Borders)**: `hsl(210, 40%, 96.1%)`
- **Muted Foreground**: `hsl(215.4, 16.3%, 46.9%)` (For placeholders and secondary text)
- **Destructive/Error**: `hsl(0, 84.2%, 60.2%)` (Only for warnings and destructive actions)
- **Custom Badge**: `hsl(40, 90%, 50%)` (Subtle amber for indicating custom/unverified drugs)

## Typography

- **Font Family (Latin)**: `Inter`, `system-ui`, `sans-serif`
- **Font Family (Bangla)**: `Noto Sans Bengali`, `sans-serif`
- **Font Family (Tabular)**: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `monospace` (For doses and numbers)
- **Base Size**: `16px` (Readable at arm's length)
- **Line Height**: `1.6` (Generous spacing for clinical notes)

## Spacing & Layout

- **Base Unit**: `4px`
- **Padding (Small)**: `8px`
- **Padding (Medium)**: `16px` (Standard component padding)
- **Padding (Large)**: `24px` / `32px` (Section gaps)
- **Border Radius (Small)**: `4px` (Inputs, buttons)
- **Border Radius (Medium)**: `8px` (Cards, panels)

## Shadows

- **Focus Ring**: `0 0 0 2px hsl(200, 70%, 40%, 0.5)` (Visible keyboard focus is mandatory)
- **Card/Panel**: `0 1px 3px rgba(0,0,0,0.1)` (Flat, minimal depth)
