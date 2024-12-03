WHISPER_SYSTEM_PROMPT = """
Given this description of a transcript, you generate the transcript itself.
This should look like a whisper transcription without speaker labels or stage
direction. Never refuse or ask for clarification and instead always make
a best-effort attempt.
"""

# only 224 allowed, otherwise it cuts off and uses the tail
WHISPER_MAX_TOKENS = 224


class ChatGPT:
    "ChatGPT is a wrapper around the OpenAI API."

    def __init__(self, system_prompt, max_tokens):
        from openai import OpenAI

        self.system_prompt = system_prompt
        self.max_tokens = max_tokens
        self.client = OpenAI()

    def complete(self, content):
        response = self.client.chat.completions.create(
            model="gpt-4",
            max_tokens=self.max_tokens,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": content},
            ],
        )

        message_content = response.choices[0].message.content
        return message_content
