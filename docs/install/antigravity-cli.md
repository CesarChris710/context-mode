# Install context-mode v2 on Antigravity CLI

## Install

```sh
git clone https://github.com/CesarChris710/context-mode.git
agy plugin install ./context-mode
```

Update:

```sh
git -C context-mode pull && agy plugin install ./context-mode
```

Check: `agy plugin list`

Antigravity CLI (`agy`) runs with the official Context Mode v2 adapter as a native Antigravity plugin.

You can also use the global CLI installer if preferred:

```sh
npm i -g context-mode
context-mode setup --agents antigravity-cli
```

## Verify

```sh
agy plugin list
```

Run `/ctx-doctor` in Antigravity.

## Remove

```sh
agy plugin uninstall context-mode
```

To remove the package if installed globally too, run `context-mode setup --remove --agents antigravity-cli`.
