"""
OpenProposal's core agent.

The agent is now built per-request using the calling user's own API key and
model choice (BYOK) - there is no shared server-wide agent or API key.
"""

from agents import Agent, ModelSettings, OpenAIChatCompletionsModel, AsyncOpenAI
from app.rulebook import PROPOSAL_RULEBOOK
from app.providers import PROVIDERS


def build_proposal_agent(provider: str, api_key: str, model: str, custom_base_url: str | None = None) -> Agent:
    provider_info = PROVIDERS.get(provider)
    if not provider_info:
        raise ValueError(f"Unknown provider: {provider}")

    base_url = provider_info["base_url"] or custom_base_url
    if not base_url:
        raise ValueError("A base URL is required for a custom provider.")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    return Agent(
        name="OpenProposal",
        instructions=PROPOSAL_RULEBOOK,
        model=OpenAIChatCompletionsModel(model=model, openai_client=client),
        model_settings=ModelSettings(temperature=0.7),
    )




# """
# OpenProposal's core agent.
# """

# import os
# from agents import Agent, ModelSettings, RunConfig, OpenAIChatCompletionsModel, AsyncOpenAI
# from app.rulebook import PROPOSAL_RULEBOOK

# MODEL = os.getenv("OPENPROPOSAL_MODEL", "nvidia/nemotron-3.5-lightning:free")
# openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

# if not openrouter_api_key:
#     raise ValueError("OPENROUTER_API_KEY environment variable is not set.")

# external_client = AsyncOpenAI(
#     api_key=openrouter_api_key,
#     base_url="https://openrouter.ai/api/v1",
# )

# model = OpenAIChatCompletionsModel(
#     model=MODEL,
#     openai_client=external_client,
# )

# config = RunConfig(
#     tracing_disabled=True,
# )


# def build_proposal_agent() -> Agent:
#     """Construct the OpenProposal agent. Called once per process."""
#     return Agent(
#         name="OpenProposal",
#         instructions=PROPOSAL_RULEBOOK,
#         model=model,
#         model_settings=ModelSettings(temperature=0.7),
#     )


