# CSML Studio Sync

This action lets you synchronize your [CSML Studio](https://studio.csml.dev) chatbot from your github respository with you CSML Studio account.

## Usage

See [example](./examples/workflow.yml).

```yml
steps:
  - uses: CSML-by-Clevy/csml-studio-sync-action@v1
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
    