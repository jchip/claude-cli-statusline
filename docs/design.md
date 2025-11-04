## Data

- Session Data

  - Data from analysis of session chat
  - Compact occured

- Status Line components

  - Working Dir
    - Claude's project dir
    - Current dir relative to project dir
  - Git
    - Repo name
    - branch
  - LLM Model
    - id
    - displayname
    - mapped display name for rendering
    - max tokens window
    - compact buffer size
  - LLM Context
    - Used Size
    - Remaining Percent
    - Remaining Percent after deducting compact buffer

## Display

- Status Line icons

  - 📦 - Workdir
  - 📁 - Current Dir
  - 🐙 - Git Repo name
  - 📦 - If Git Repo name same as working dir basename
    - otherwise show git repo name
  - ⎇ - Git branch (icon green)
  - 🧠 - Model Display name
  - ✦ - separator between two context percent
  - ⚡️ - separator between second percent and model max tokens window, in K (thousands) or M (Million)
  - 💫 - if context was compacted (auto or manual)
  - ⚙️ - follow the max token if it was retrieved from default config value
  - 🏷️ - follow the max token if it was retrieved from display name config value

- Sample display:
  `📦 ~/dev/claude-cli-statusline › 📁 . 🐙 📦 ⎇ main 🧠 Sonnet 4.5 ⏬ 75%✦52%⚡️200K`

## Architecture

- There should be classes to represent session data analysis result
- There should be classes represent each status line component
- There should be a class to hold all status line components
- There should be a class to hold all the icons
- There should be a rendering class
  - consider having a formatter class as well

Execution Flow:

- First should gather all the data
  - The sample input
  - The config file, with load order:
    1. `${project_dir}/.claude/statusline-config.json`
    2. `~/.claude/statusline-config.json`
    3. Script Dir
  - The session analysis cache
  - The session jsonl
  - analyze any new entries in the session and update data
  - The status line component data
- Second then do the formatting and rendering
- Finally:
  - Save sample input (if requested)
  - Save session analysis data, with the sample input and the final rendered status line
