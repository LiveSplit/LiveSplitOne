1. After every code change decide whether the codebase needs to be refactored,
   especially around the code changes. Refactoring should be necessary once a
   file contains too many independent concepts and once it gets large (> 800
   lines of code).
2. After making changes to the code, make sure to run linting (clippy in case of
   Rust), formatting and the test.
3. It is extremely important to add comments, especially to explain why a
   certain piece of code is implemented in a certain way or why a certain design
   decision was made. This is crucial for future maintainers of the codebase, as
   it helps them understand the reasoning behind the implementation and makes it
   easier for them to make informed decisions when modifying the code in the
   future. You may even write entire paragraphs of comments if you think it is
   necessary to explain the code and the reasoning behind it. The more detailed
   and comprehensive the comments are, the better it is for future maintainers
   of the codebase.
4. After making changes, also make sure that the documentation (like the README)
   is updated if necessary.
