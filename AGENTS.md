# Project architecture decisions

- Studio Noir v3 is the sole visual system: warm near-monochrome surfaces, sapphire for human actions, and vapor only for clearly labelled AI output, keeping hierarchy and meaning consistent.
- The app ships dark-first by applying `.dark` on the document while retaining a complete light token set for conventional component behavior and accessibility.