{
  pkgs,
  ...
}:
{
  packages = with pkgs; [
    git
    claude-code
  ];

  languages = {
    javascript = {
      enable = true;
      package = pkgs.nodejs-slim_24;

      pnpm = {
        enable = true;
        package = pkgs.pnpm;
        install.enable = true;
      };
    };
    python = {
      enable = true;

      uv = {
        enable = true;
        sync.enable = true;
      };
    };
  };
}
