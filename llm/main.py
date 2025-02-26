from langchain_openai.chat_models import ChatOpenAI
from typing import List, Callable, Any, Union

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
import json
from langchain_core.messages import ToolMessage
import requests
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.prebuilt import tools_condition, ToolNode
from src.cache import cache
from src.cache import Categories, PriceTier
import os
os.environ["OPENAI_API_KEY"] = "api_key"


def chatbot(sysMessage: str, tools: List[Callable[..., Any]]):
    def fetch_page(url: str) -> Union[requests.Response, str]:
        """
        Fetches a webpage using an HTTP GET request.

        Args:
            url (str): The URL of the webpage to fetch.

        Returns:
            Union[requests.Response, str]: The HTTP response object if successful,
            or an error message string if the request fails.

        Raises:
            requests.exceptions.RequestException: If a network-related error occurs.
        """
        try:
            response = requests.get(url, timeout=10)  # Send GET request with a timeout of 10 seconds
            response.raise_for_status()  # Raise an error for HTTP failures (4xx, 5xx)
            return response.text  # Return the response object
        except requests.exceptions.RequestException:
            return "Error fetching URL"

    llm = ChatOpenAI(model="gpt-4o")
    llm_with_tools = llm.bind_tools(tools)

    sysMessage = SystemMessage(content=sysMessage)
 
    # def assistant(state: MessagesState):
    #     # Use memory to retrieve previous messages
    #     previous_messages = memory.load_memory()

    #     # Combine previous messages with the current state
    #     user_message = HumanMessage(content=state["messages"][0]["content"])
    #     current_messages = previous_messages + [user_message]

    #     # Invoke the language model
    #     response = llm_with_tools.invoke(current_messages)

    #     # Save the current message to memory
    #     memory.save_memory(current_messages)

    #     return {"messages": [response]}
    
    def assistant(state: MessagesState):
        # check if the dictionary returns the correct states
        return {"messages": [llm_with_tools.invoke([sysMessage] + state["messages"])]}


    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant)
    builder.add_node("tools", ToolNode(tools))

    builder.add_edge(START, "assistant")
    builder.add_conditional_edges("assistant", tools_condition,)
    builder.add_edge("tools", "assistant")

    graph = builder.compile()
    return graph

