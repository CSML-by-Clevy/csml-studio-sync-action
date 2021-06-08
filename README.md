# CSML Studio Sync

This action lets you synchronize your chatbot from your github respository to your CSML Studio account.

## Usage

See [example](./examples/workflow.yml)

```yml
steps:
  - uses: CSML-by-Clevy/csml-studio-sync-action
    with:
      update: true
      build: true
      create-snapshot: true
    env:
      CSML_CLIENT_API_KEY: ${{ secrets.CSML_CLIENT_API_KEY }}
      CSML_CLIENT_API_SECRET: ${{ secrets.CSML_CLIENT_API_SECRET }}
```

## License

The scripts and documentation in this project are released under the MIT License
    