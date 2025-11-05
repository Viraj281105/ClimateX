import ollama

client = ollama.Client()

response = client.chat(
    model="mistral",
    messages=[{"role": "user", "content": "List 3 renewable energy initiatives in India"}]
)

print("\n Ollama connected successfully!\n")
print(response["message"]["content"])
