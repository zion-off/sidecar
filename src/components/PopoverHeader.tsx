export const PopoverHeader = () => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium leading-none">OpenRouter Configuration</h4>
      <p className="text-muted-foreground">
        Set the OpenRouter API key and model configuration. Get your API key{' '}
        <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
          here
        </a>
        .
      </p>
    </div>
  );
};
