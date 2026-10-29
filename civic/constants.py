"""Fixed identifiers used by business logic.

Labels, wards, slots and other lists are editable copy in the ``options`` document
(``content/data/options.json``, read through ``cms.copy.option_list``). Only the ids
below are fixed: the forms and booking rules compare against them.
"""

# A slot is bookable until it holds this many active appointments.
SLOT_CAPACITY = 4

APPOINTMENT_MODES = ["in-person", "phone", "home-visit"]
FEEDBACK_KINDS = ["problem", "advice", "threat"]
FEEDBACK_SEVERITIES = ["low", "medium", "high", "critical"]
