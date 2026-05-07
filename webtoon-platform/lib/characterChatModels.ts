export type CharacterChatModelKey = 'default' | 'characterCreator';

export type CharacterChatModelOption = {
  key: CharacterChatModelKey;
  label: string;
  description: string;
  model: string;
};

export const defaultCharacterChatModel = 'exaone3.5:2.4b';
export const characterCreatorModel =
  'hf.co/SufficientPrune3897/Llama-3.3-8B-Character-Creator-V2-GGUF:Q5_K_M';

export function characterChatModelOptions(): CharacterChatModelOption[] {
  return [
    {
      key: 'default',
      label: '기본 한국어 모델',
      description: '빠르고 한국어 안정성이 좋은 기본 Ollama 모델',
      model: process.env.LOCAL_LLM_MODEL || defaultCharacterChatModel,
    },
    {
      key: 'characterCreator',
      label: '캐릭터 특화 모델',
      description: '롤플레이/캐릭터 설정에 튜닝된 Llama 3.3 8B GGUF',
      model: process.env.CHARACTER_CREATOR_LLM_MODEL || characterCreatorModel,
    },
  ];
}

export function resolveCharacterChatModel(key: unknown): CharacterChatModelOption {
  const options = characterChatModelOptions();
  const value = typeof key === 'string' ? key : 'default';
  return options.find((option) => option.key === value) || options[0];
}
